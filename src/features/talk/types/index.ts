/**
 * Kodama Talk — domain types (v1).
 *
 * Every security-sensitive model carries `protocolVersion` so the future
 * centralized, zero-knowledge backend can negotiate format without guessing.
 * The mock frontend never performs real encryption — see privacy-boundaries.md.
 */

export const TALK_PROTOCOL_VERSION = "kodama-talk/v1" as const;
export type TalkProtocolVersion = typeof TALK_PROTOCOL_VERSION;

/** A Talk address is a place, not a username. e.g. "alex" in talk.kodama.page/alex */
export type TalkAddress = string;

export interface PlaceMarkSpec {
  initials: string;
  gradient: [string, string];
  coverUrl?: string;
}

export type DropReceiving = "open" | "invite-only" | "closed";

export interface Place {
  address: TalkAddress;
  displayName: string;
  tagline: string;
  /** One gentle line shown to visitors on the Door (office-hours / away). */
  doorNote?: string;
  mark: PlaceMarkSpec;
  claimed: boolean;
  dropReceiving: DropReceiving;
  createdAt: string;
  protocolVersion: TalkProtocolVersion;
}

export type PrivacyLevel = "private-planned" | "plaintext-mock";

export interface PrivacyStatus {
  level: PrivacyLevel;
  label: string;
  description: string;
}

export interface Attachment {
  id: string;
  name: string;
  kind: "image" | "file" | "audio" | "link";
  sizeLabel?: string;
  previewUrl?: string;
  /** Future: attachments are sealed independently. */
  sealed?: boolean;
}

export interface Reaction {
  emoji: string;
  by: string;
}

/* ── Drops ── */

export type DropStatus =
  | "sending"
  | "delivered"
  | "accepted"
  | "declined"
  | "blocked";

export type DropOrigin = "anonymous" | "named" | "place";

export interface Drop {
  id: string;
  toAddress: TalkAddress;
  origin: DropOrigin;
  fromLabel: string;
  fromAddress?: TalkAddress;
  /** Optional one-line subject so Drops scan like an inbox for the owner. */
  subject?: string;
  body: string;
  attachments: Attachment[];
  status: DropStatus;
  createdAt: string;
  privacy: PrivacyStatus;
  /** Set once a reply converts the Drop into a Direct Talk. */
  conversationId?: string;
  protocolVersion: TalkProtocolVersion;
}

/* ── Conversations (Direct Talk / Group / Channel) ── */

export type ConversationKind = "direct" | "group" | "channel";
export type ChannelVisibility = "public" | "private";
/** Channel reply modes — user-facing wording lives in the UI. */
export type ChannelReplyPolicy =
  | "read-only"
  | "reviewed"
  | "open"
  | "members"
  | "private-contact";
export type ConversationState = "active" | "archived" | "locked" | "expired";

export interface Member {
  label: string;
  address?: TalkAddress;
  role: "owner" | "member" | "publisher";
  mark: PlaceMarkSpec;
}

export interface Conversation {
  id: string;
  kind: ConversationKind;
  placeAddress: TalkAddress;
  title: string;
  subtitle?: string;
  mark: PlaceMarkSpec;
  members: Member[];
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
  pinned: boolean;
  muted: boolean;
  state: ConversationState;
  /** Channel-only settings. */
  visibility?: ChannelVisibility;
  replyPolicy?: ChannelReplyPolicy;
  /** Channel URL segment — address is `${placeAddress}/${channelSlug}`. */
  channelSlug?: string;
  /** True when this Direct Talk grew out of a Drop — used to gently nudge replies. */
  bornFromDrop?: boolean;
  protocolVersion: TalkProtocolVersion;
}

/* ── Channel replies (public "Drop a reply") ── */

export type ChannelReplyStatus = "pending" | "published" | "declined";

export interface ChannelReply {
  id: string;
  channelId: string;
  origin: DropOrigin;
  fromLabel: string;
  fromAddress?: TalkAddress;
  body: string;
  attachments: Attachment[];
  status: ChannelReplyStatus;
  createdAt: string;
  privacy: PrivacyStatus;
  protocolVersion: TalkProtocolVersion;
}

export interface ThreadReference {
  messageId: string;
  authorLabel: string;
  excerpt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  authorLabel: string;
  fromOwner: boolean;
  body: string;
  attachments: Attachment[];
  reactions: Reaction[];
  replyTo?: ThreadReference;
  createdAt: string;
  privacy: PrivacyStatus;
  /** How the owner signed this message: place (default), anonymous, or named. */
  origin?: DropOrigin;
  protocolVersion: TalkProtocolVersion;
}

/* ── Invites & membership (future-sealed secrets) ── */

export interface Invite {
  id: string;
  conversationId: string;
  code: string;
  label: string;
  createdAt: string;
  expiresAt?: string;
  /** Future: invite secret is sealed; never a raw membership key in plaintext. */
  protocolVersion: TalkProtocolVersion;
}

/* ── Owner session & settings ── */

export interface NotificationPrefs {
  incomingDrops: boolean;
  directReplies: boolean;
  groupActivity: boolean;
  channelPosts: boolean;
  quietHours: boolean;
}

export interface OwnerSession {
  address: TalkAddress;
  displayName: string;
  /** Whether this device is remembered (local owner credential present). */
  rememberedDevice: boolean;
  createdAt: string;
  protocolVersion: TalkProtocolVersion;
}

export interface Shelf {
  address: TalkAddress;
  incoming: Drop[];
  sent: Drop[];
  directTalks: Conversation[];
  groups: Conversation[];
  channels: Conversation[];
  pinned: Conversation[];
}

/* ── Service input shapes ── */

export interface SendDropInput {
  toAddress: TalkAddress;
  origin: DropOrigin;
  fromLabel: string;
  fromAddress?: TalkAddress;
  subject?: string;
  body: string;
  attachments?: Attachment[];
}

export interface SendMessageInput {
  conversationId: string;
  body: string;
  replyTo?: ThreadReference;
  attachments?: Attachment[];
  /** How you signed this message — from your place (default), anonymously, or by name. */
  origin?: DropOrigin;
  /** Display name to show when origin is "named". */
  fromLabel?: string;
}

export interface ClaimAddressInput {
  address: TalkAddress;
  displayName: string;
  tagline?: string;
  ownerPassword: string;
}

export interface CreateGroupInput {
  placeAddress: TalkAddress;
  title: string;
  memberLabels: string[];
}

export interface CreateChannelInput {
  placeAddress: TalkAddress;
  title: string;
  visibility: ChannelVisibility;
  replyPolicy: ChannelReplyPolicy;
}

export interface SubmitChannelReplyInput {
  channelId: string;
  origin: DropOrigin;
  fromLabel: string;
  fromAddress?: TalkAddress;
  body: string;
  attachments?: Attachment[];
}

export interface SearchResult {
  conversations: Conversation[];
  messages: Message[];
  drops: Drop[];
}
