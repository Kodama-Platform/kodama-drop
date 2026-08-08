/**
 * Talk security adapter — the ONE place Kodama Talk touches cryptography.
 *
 * Talk feature code must never import `@kodama.page/security-browser`,
 * `@kodama.page/core`, or Node/Web crypto directly. It goes through here.
 *
 * The frontend build is a MOCK: nothing is really encrypted, and the UI says so
 * via `describePrivacy()`. The models below describe the intended zero-knowledge
 * boundary so it can be wired in later without redesigning the experience.
 * We do NOT reimplement crypto in Talk.
 */

import { TALK_PROTOCOL_VERSION, type PrivacyStatus } from "@/features/talk/types";

/* ── Future sealed shapes (modelled, not yet real) ── */

export interface SealedPayload {
  protocolVersion: typeof TALK_PROTOCOL_VERSION;
  scheme: "plaintext" | "kodama-zk";
  ciphertext: string;
}

/** Device-held owner credential — derived locally, never sent to Kodama. */
export interface OwnerCredential {
  protocolVersion: typeof TALK_PROTOCOL_VERSION;
  address: string;
  /** Opaque key reference; real key material stays in kodama-security-core. */
  keyRef: string;
  rememberedDevice: boolean;
}

/** Sealed invite secret for Groups / private Channels. */
export interface InviteSecret {
  protocolVersion: typeof TALK_PROTOCOL_VERSION;
  conversationId: string;
  sealed: SealedPayload;
  expiresAt?: string;
}

/** Per-member sealed credential for a private conversation. */
export interface MembershipCredential {
  protocolVersion: typeof TALK_PROTOCOL_VERSION;
  conversationId: string;
  memberRef: string;
  sealed: SealedPayload;
}

/** Key rotation event (e.g. member removed → conversation re-keyed). */
export interface KeyRotation {
  protocolVersion: typeof TALK_PROTOCOL_VERSION;
  conversationId: string;
  epoch: number;
  reason: "member-removed" | "manual" | "scheduled";
  rotatedAt: string;
}

export interface TalkSecurityAdapter {
  readonly protocolVersion: typeof TALK_PROTOCOL_VERSION;
  describePrivacy(): PrivacyStatus;
  /** Seal a body/attachment for a place before it leaves the device. */
  sealForPlace(plaintext: string): Promise<SealedPayload>;
  /** Seal a message for a conversation's current key epoch. */
  sealForConversation(conversationId: string, plaintext: string): Promise<SealedPayload>;
  open(payload: SealedPayload): Promise<string>;
  /** Derive a device-held owner credential from the owner password. */
  deriveOwnerCredential(address: string, password: string, remember: boolean): Promise<OwnerCredential>;
  /** Mint a sealed invite secret for a private conversation. */
  mintInvite(conversationId: string, expiresAt?: string): Promise<InviteSecret>;
  /** Model a re-key when membership changes. */
  rotateKeys(conversationId: string, reason: KeyRotation["reason"]): Promise<KeyRotation>;
  /** Lazily load the shared kodama-security-core (heavy WASM) when real crypto lands. */
  loadSecurityCore(): Promise<unknown>;
}

const PLAINTEXT_MOCK: PrivacyStatus = {
  level: "plaintext-mock",
  label: "Private by design",
  description:
    "Conversations are meant to be encrypted before they reach Kodama — we couldn't read them. This early preview keeps messages on your device while that encryption is wired in.",
};

export const PLANNED_PRIVATE: PrivacyStatus = {
  level: "private-planned",
  label: "Private by design",
  description:
    "Private conversations are encrypted before they reach Kodama. We cannot read them.",
};

let epochs: Record<string, number> = {};

class MockTalkSecurityAdapter implements TalkSecurityAdapter {
  readonly protocolVersion = TALK_PROTOCOL_VERSION;

  describePrivacy(): PrivacyStatus {
    return PLAINTEXT_MOCK;
  }

  async sealForPlace(plaintext: string): Promise<SealedPayload> {
    return { protocolVersion: TALK_PROTOCOL_VERSION, scheme: "plaintext", ciphertext: plaintext };
  }

  async sealForConversation(_conversationId: string, plaintext: string): Promise<SealedPayload> {
    return { protocolVersion: TALK_PROTOCOL_VERSION, scheme: "plaintext", ciphertext: plaintext };
  }

  async open(payload: SealedPayload): Promise<string> {
    return payload.ciphertext;
  }

  async deriveOwnerCredential(address: string, _password: string, remember: boolean): Promise<OwnerCredential> {
    return {
      protocolVersion: TALK_PROTOCOL_VERSION,
      address,
      keyRef: `mock:${address}`,
      rememberedDevice: remember,
    };
  }

  async mintInvite(conversationId: string, expiresAt?: string): Promise<InviteSecret> {
    return {
      protocolVersion: TALK_PROTOCOL_VERSION,
      conversationId,
      sealed: { protocolVersion: TALK_PROTOCOL_VERSION, scheme: "plaintext", ciphertext: Math.random().toString(36).slice(2) },
      expiresAt,
    };
  }

  async rotateKeys(conversationId: string, reason: KeyRotation["reason"]): Promise<KeyRotation> {
    epochs[conversationId] = (epochs[conversationId] ?? 0) + 1;
    return {
      protocolVersion: TALK_PROTOCOL_VERSION,
      conversationId,
      epoch: epochs[conversationId],
      reason,
      rotatedAt: new Date().toISOString(),
    };
  }

  async loadSecurityCore(): Promise<unknown> {
    const mod = await import("@kodama.page/security-browser");
    return mod;
  }
}

let adapter: TalkSecurityAdapter | null = null;

export function getTalkSecurity(): TalkSecurityAdapter {
  if (!adapter) adapter = new MockTalkSecurityAdapter();
  return adapter;
}
