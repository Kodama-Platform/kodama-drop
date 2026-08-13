/**
 * MockTalkService — frontend-only implementation of TalkService.
 * In-memory (seeded) state, persisted to localStorage. No network, no real
 * crypto. This is the component a `RemoteTalkService` replaces later.
 */

import type { TalkService } from "@/features/talk/services/talk-service";
import type {
  ChannelReply,
  ClaimAddressInput,
  Conversation,
  CreateChannelInput,
  CreateGroupInput,
  Drop,
  Invite,
  Member,
  Message,
  NotificationPrefs,
  OwnerSession,
  Place,
  SearchResult,
  SendDropInput,
  SendMessageInput,
  Shelf,
  SubmitChannelReplyInput,
  TalkAddress,
} from "@/features/talk/types";
import { TALK_PROTOCOL_VERSION } from "@/features/talk/types";
import { markFor } from "@/features/talk/lib/mark";
import { normalizeSlug } from "@/lib/slug";
import { PLANNED_PRIVATE, getTalkSecurity } from "@/features/talk/security/talk-security-adapter";
import {
  SEED_CHANNEL_REPLIES,
  SEED_CONVERSATIONS,
  SEED_INCOMING,
  SEED_MESSAGES,
  SEED_PLACES,
  SEED_SENT,
} from "@/features/talk/mock/seed";

const STORAGE_KEY = "kodama-talk/v2/state";
const CRED_KEY = "kodama-talk/v1/owner-cred";
const SESSION_KEY = "kodama-talk/v1/session";
const PERSIST_KEY = "kodama-talk/v1/stay";
const LAST_KEY = "kodama-talk/v1/last-talk";
const DRAFT_KEY = "kodama-talk/v1/drafts";
const FOLLOW_KEY = "kodama-talk/v1/follows";
const MEMBER_KEY = "kodama-talk/v1/members";
const LATENCY = 220;
const P = TALK_PROTOCOL_VERSION;

interface TalkState {
  places: Place[];
  incoming: Drop[];
  sent: Drop[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  invites: Invite[];
  prefs: Record<string, NotificationPrefs>;
  channelReplies: ChannelReply[];
}

const DEFAULT_PREFS: NotificationPrefs = {
  incomingDrops: true,
  directReplies: true,
  groupActivity: true,
  channelPosts: false,
  quietHours: false,
};

const delay = <T,>(v: T): Promise<T> => new Promise((r) => setTimeout(() => r(v), LATENCY));
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

function seedState(): TalkState {
  return {
    places: structuredClone(SEED_PLACES),
    incoming: structuredClone(SEED_INCOMING),
    sent: structuredClone(SEED_SENT),
    conversations: structuredClone(SEED_CONVERSATIONS),
    messages: structuredClone(SEED_MESSAGES),
    invites: [],
    prefs: {},
    channelReplies: structuredClone(SEED_CHANNEL_REPLIES),
  };
}

export class MockTalkService implements TalkService {
  private state: TalkState;

  constructor() {
    this.state = this.load();
  }

  private load(): TalkState {
    if (typeof window === "undefined") return seedState();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as TalkState) : seedState();
    } catch {
      return seedState();
    }
  }

  private persist(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* ignore */
    }
  }

  private conv(id: string): Conversation | undefined {
    return this.state.conversations.find((c) => c.id === id);
  }

  /* ── Door ── */

  async resolvePlace(address: TalkAddress): Promise<Place | null> {
    return delay(this.state.places.find((p) => p.address === address) ?? null);
  }

  async claimAddress(input: ClaimAddressInput): Promise<Place> {
    const existing = this.state.places.find((p) => p.address === input.address);
    if (existing?.claimed) throw new Error("address_taken");
    await getTalkSecurity().deriveOwnerCredential(input.address, input.ownerPassword, true);
    const place: Place = {
      address: input.address,
      displayName: input.displayName,
      tagline: input.tagline ?? "Drop me a message.",
      mark: markFor(input.displayName, input.address),
      claimed: true,
      dropReceiving: "open",
      createdAt: new Date().toISOString(),
      protocolVersion: P,
    };
    this.state.places = [place, ...this.state.places.filter((p) => p.address !== input.address)];
    this.persist();
    return delay(place);
  }

  async sendDrop(input: SendDropInput): Promise<Drop> {
    await getTalkSecurity().sealForPlace(input.body);
    const drop: Drop = {
      id: uid("drop"),
      toAddress: input.toAddress,
      origin: input.origin,
      fromLabel: input.fromLabel || (input.origin === "anonymous" ? "someone" : "guest"),
      fromAddress: input.fromAddress,
      subject: input.subject?.trim() || undefined,
      body: input.body,
      attachments: input.attachments ?? [],
      status: "delivered",
      createdAt: new Date().toISOString(),
      privacy: PLANNED_PRIVATE,
      protocolVersion: P,
    };
    this.state.incoming = [drop, ...this.state.incoming];
    // Reflect in the sender's own place as a sent Drop (growth loop).
    if (input.fromAddress) this.state.sent = [{ ...drop }, ...this.state.sent];
    this.persist();
    return delay(drop);
  }

  /* ── Owner ── */

  async unlockOwner(address: TalkAddress, password: string, remember: boolean): Promise<OwnerSession | null> {
    const place = this.state.places.find((p) => p.address === address && p.claimed);
    if (!place || password.length < 4) return delay(null);
    const cred = await getTalkSecurity().deriveOwnerCredential(address, password, remember);
    if (typeof window !== "undefined") {
      if (remember) window.localStorage.setItem(`${CRED_KEY}:${address}`, JSON.stringify({ address, displayName: place.displayName }));
      else window.localStorage.removeItem(`${CRED_KEY}:${address}`);
    }
    return delay({
      address: place.address,
      displayName: place.displayName,
      rememberedDevice: cred.rememberedDevice,
      createdAt: new Date().toISOString(),
      protocolVersion: P,
    });
  }

  rememberedSession(address: TalkAddress): OwnerSession | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(`${CRED_KEY}:${address}`);
    if (!raw) return null;
    try {
      const c = JSON.parse(raw) as { address: string; displayName: string };
      return { address: c.address, displayName: c.displayName, rememberedDevice: true, createdAt: new Date().toISOString(), protocolVersion: P };
    } catch {
      return null;
    }
  }

  activeSession(address: TalkAddress): OwnerSession | null {
    if (typeof window === "undefined") return null;
    try {
      const live = window.sessionStorage.getItem(`${SESSION_KEY}:${address}`);
      if (live) return JSON.parse(live) as OwnerSession;
      // "Keep me signed in" — survives closing the tab, until an explicit lock.
      const kept = window.localStorage.getItem(`${PERSIST_KEY}:${address}`);
      return kept ? (JSON.parse(kept) as OwnerSession) : null;
    } catch {
      return null;
    }
  }

  beginSession(session: OwnerSession, persist = false): void {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(`${SESSION_KEY}:${session.address}`, JSON.stringify(session));
      if (persist) {
        window.localStorage.setItem(`${PERSIST_KEY}:${session.address}`, JSON.stringify(session));
        // Remember this as the last opted-in Talk so revisiting resumes it.
        window.localStorage.setItem(LAST_KEY, session.address);
      } else {
        window.localStorage.removeItem(`${PERSIST_KEY}:${session.address}`);
        if (window.localStorage.getItem(LAST_KEY) === session.address) window.localStorage.removeItem(LAST_KEY);
      }
    } catch {
      /* ignore */
    }
  }

  endSession(address: TalkAddress): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(`${SESSION_KEY}:${address}`);
    window.localStorage.removeItem(`${PERSIST_KEY}:${address}`);
    if (window.localStorage.getItem(LAST_KEY) === address) window.localStorage.removeItem(LAST_KEY);
  }

  isPersisted(address: TalkAddress): boolean {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(`${PERSIST_KEY}:${address}`) != null;
  }

  lastOpenedTalk(): OwnerSession | null {
    if (typeof window === "undefined") return null;
    const address = window.localStorage.getItem(LAST_KEY);
    return address ? this.activeSession(address) : null;
  }

  forgetDevice(address: TalkAddress): void {
    if (typeof window !== "undefined") window.localStorage.removeItem(`${CRED_KEY}:${address}`);
    this.endSession(address);
  }

  async getShelf(session: OwnerSession): Promise<Shelf> {
    const a = session.address;
    const mine = this.state.conversations.filter((c) => c.placeAddress === a && c.state !== "archived");
    return delay({
      address: a,
      incoming: this.state.incoming.filter((d) => d.toAddress === a && d.status === "delivered"),
      sent: this.state.sent.filter((d) => d.fromAddress === a),
      directTalks: mine.filter((c) => c.kind === "direct"),
      groups: mine.filter((c) => c.kind === "group"),
      channels: mine.filter((c) => c.kind === "channel"),
      pinned: mine.filter((c) => c.pinned),
    });
  }

  async updatePlace(address: TalkAddress, patch: Partial<Pick<Place, "displayName" | "tagline" | "dropReceiving" | "doorNote">>): Promise<Place> {
    const place = this.state.places.find((p) => p.address === address);
    if (!place) throw new Error("not_found");
    Object.assign(place, patch);
    this.persist();
    return delay(place);
  }

  async getNotificationPrefs(address: TalkAddress): Promise<NotificationPrefs> {
    return delay(this.state.prefs[address] ?? DEFAULT_PREFS);
  }

  async setNotificationPrefs(address: TalkAddress, prefs: NotificationPrefs): Promise<void> {
    this.state.prefs[address] = prefs;
    this.persist();
    return delay(undefined);
  }

  /* ── Drops ── */

  async replyToDrop(dropId: string, body: string): Promise<Conversation> {
    const drop = this.state.incoming.find((d) => d.id === dropId);
    if (!drop) throw new Error("not_found");
    let conv = drop.conversationId ? this.conv(drop.conversationId) : undefined;
    if (!conv) {
      conv = {
        id: uid("conv"),
        kind: "direct",
        placeAddress: drop.toAddress,
        title: drop.fromLabel,
        subtitle: drop.fromAddress ? `talk.kodama.page/${drop.fromAddress}` : "from a Drop",
        mark: markFor(drop.fromLabel, drop.fromAddress ?? drop.fromLabel),
        members: [member(drop.toAddress), member(drop.fromLabel, "member", drop.fromAddress)],
        lastMessagePreview: body,
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        pinned: false,
        muted: false,
        state: "active",
        protocolVersion: P,
      };
      this.state.conversations = [conv, ...this.state.conversations];
      this.state.messages[conv.id] = [
        seedMsg(uid("m"), conv.id, drop.fromLabel, false, drop.body, drop.createdAt),
      ];
      drop.conversationId = conv.id;
    }
    drop.status = "accepted";
    await getTalkSecurity().sealForConversation(conv.id, body);
    this.state.messages[conv.id] = [
      ...(this.state.messages[conv.id] ?? []),
      seedMsg(uid("m"), conv.id, "You", true, body, new Date().toISOString()),
    ];
    conv.lastMessagePreview = body;
    conv.lastMessageAt = new Date().toISOString();
    this.persist();
    return delay(conv);
  }

  async continueSentDrop(dropId: string): Promise<Conversation> {
    const drop = this.state.sent.find((d) => d.id === dropId);
    if (!drop) throw new Error("not_found");
    const existing = drop.conversationId ? this.conv(drop.conversationId) : undefined;
    if (existing) return delay(existing);

    const me = drop.fromAddress ?? "you";
    const place = this.state.places.find((p) => p.address === drop.toAddress && p.claimed);
    const theirLabel = place?.displayName ?? drop.toAddress;
    const now = new Date().toISOString();
    const conv: Conversation = {
      id: uid("conv"),
      kind: "direct",
      placeAddress: me,
      title: theirLabel,
      subtitle: `talk.kodama.page/${drop.toAddress}`,
      mark: markFor(theirLabel, drop.toAddress),
      members: [member(me), member(theirLabel, "member", drop.toAddress)],
      lastMessagePreview: "",
      lastMessageAt: now,
      unreadCount: 1,
      pinned: false,
      muted: false,
      state: "active",
      protocolVersion: P,
    };
    // The note keeps going: your original Drop is the first fragment; their reply follows.
    const reply = "Got your note — let's keep it going here.";
    this.state.messages[conv.id] = [
      seedMsg(uid("m"), conv.id, "You", true, drop.body, drop.createdAt),
      seedMsg(uid("m"), conv.id, theirLabel, false, reply, now),
    ];
    conv.lastMessagePreview = reply;
    this.state.conversations = [conv, ...this.state.conversations];
    drop.conversationId = conv.id;
    drop.status = "accepted";
    this.persist();
    return delay(conv);
  }

  async declineDrop(dropId: string): Promise<void> {
    const drop = this.state.incoming.find((d) => d.id === dropId);
    if (drop) drop.status = "declined";
    this.persist();
    return delay(undefined);
  }

  async blockDrop(dropId: string): Promise<void> {
    const drop = this.state.incoming.find((d) => d.id === dropId);
    if (drop) drop.status = "blocked";
    this.persist();
    return delay(undefined);
  }

  /* ── Conversations ── */

  async listConversations(address: TalkAddress): Promise<Conversation[]> {
    return delay(
      this.state.conversations
        .filter((c) => c.placeAddress === address)
        .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt)),
    );
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return delay(this.conv(id) ?? null);
  }

  async listMessages(id: string): Promise<Message[]> {
    return delay(this.state.messages[id] ?? []);
  }

  async sendMessage(input: SendMessageInput): Promise<Message> {
    await getTalkSecurity().sealForConversation(input.conversationId, input.body);
    const m = seedMsg(uid("m"), input.conversationId, "You", true, input.body, new Date().toISOString(), input.replyTo);
    m.attachments = input.attachments ?? [];
    this.state.messages[input.conversationId] = [...(this.state.messages[input.conversationId] ?? []), m];
    const c = this.conv(input.conversationId);
    if (c) {
      c.lastMessagePreview = input.body;
      c.lastMessageAt = m.createdAt;
    }
    this.saveDraft(input.conversationId, "");
    this.persist();
    return delay(m);
  }

  async addReaction(messageId: string, emoji: string): Promise<void> {
    for (const list of Object.values(this.state.messages)) {
      const m = list.find((x) => x.id === messageId);
      if (m) {
        const existing = m.reactions.find((r) => r.emoji === emoji && r.by === "You");
        if (existing) m.reactions = m.reactions.filter((r) => r !== existing);
        else m.reactions.push({ emoji, by: "You" });
        break;
      }
    }
    this.persist();
    return delay(undefined);
  }

  async markRead(id: string): Promise<void> {
    const c = this.conv(id);
    if (c) c.unreadCount = 0;
    this.persist();
    return delay(undefined);
  }

  async setPinned(id: string, pinned: boolean): Promise<void> {
    const c = this.conv(id);
    if (c) c.pinned = pinned;
    this.persist();
    return delay(undefined);
  }

  async setMuted(id: string, muted: boolean): Promise<void> {
    const c = this.conv(id);
    if (c) c.muted = muted;
    this.persist();
    return delay(undefined);
  }

  async setArchived(id: string, archived: boolean): Promise<void> {
    const c = this.conv(id);
    if (c) c.state = archived ? "archived" : "active";
    this.persist();
    return delay(undefined);
  }

  async setLocked(id: string, locked: boolean): Promise<void> {
    const c = this.conv(id);
    if (c) c.state = locked ? "locked" : "active";
    this.persist();
    return delay(undefined);
  }

  async deleteConversation(id: string): Promise<void> {
    this.state.conversations = this.state.conversations.filter((c) => c.id !== id);
    delete this.state.messages[id];
    this.persist();
    return delay(undefined);
  }

  /* ── Groups & Channels ── */

  async createGroup(input: CreateGroupInput): Promise<Conversation> {
    const members: Member[] = [member(input.placeAddress), ...input.memberLabels.filter(Boolean).map((l) => member(l, "member"))];
    const conv: Conversation = {
      id: uid("conv"),
      kind: "group",
      placeAddress: input.placeAddress,
      title: input.title,
      subtitle: `${members.length} members · private`,
      mark: markFor(input.title, input.title),
      members,
      lastMessagePreview: "Group created. Invite people to begin.",
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      pinned: false,
      muted: false,
      state: "active",
      protocolVersion: P,
    };
    this.state.conversations = [conv, ...this.state.conversations];
    this.state.messages[conv.id] = [];
    this.persist();
    return delay(conv);
  }

  async createChannel(input: CreateChannelInput): Promise<Conversation> {
    const slug = normalizeSlug(input.title) || uid("chan");
    const conv: Conversation = {
      id: uid("conv"),
      kind: "channel",
      placeAddress: input.placeAddress,
      title: input.title,
      subtitle: `${input.visibility === "public" ? "Public" : "Private"} channel`,
      mark: markFor(input.title, input.title),
      members: [member(input.placeAddress, "owner")],
      lastMessagePreview: "Channel created.",
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      pinned: false,
      muted: false,
      state: "active",
      visibility: input.visibility,
      replyPolicy: input.replyPolicy,
      channelSlug: slug,
      protocolVersion: P,
    };
    this.state.conversations = [conv, ...this.state.conversations];
    this.state.messages[conv.id] = [];
    this.persist();
    return delay(conv);
  }

  /* ── Channels: public reachability ── */

  private channelAddress(c: Conversation): string {
    return `${c.placeAddress}/${c.channelSlug ?? normalizeSlug(c.title)}`;
  }

  async resolveChannel(placeAddress: TalkAddress, slug: string): Promise<Conversation | null> {
    const c = this.state.conversations.find(
      (x) => x.kind === "channel" && x.placeAddress === placeAddress && (x.channelSlug ?? normalizeSlug(x.title)) === slug,
    );
    return delay(c ?? null);
  }

  private appendReplyAsMessage(c: Conversation, reply: ChannelReply): void {
    const author = reply.origin === "anonymous" ? "Anonymous" : reply.fromLabel;
    const m = seedMsg(uid("m"), c.id, author, false, reply.body, new Date().toISOString());
    m.attachments = reply.attachments;
    this.state.messages[c.id] = [...(this.state.messages[c.id] ?? []), m];
    c.lastMessagePreview = reply.body;
    c.lastMessageAt = m.createdAt;
  }

  async submitChannelReply(input: SubmitChannelReplyInput): Promise<{ status: "published" | "pending" }> {
    const c = this.conv(input.channelId);
    if (!c || c.kind !== "channel") throw new Error("not_found");
    if (c.state === "locked" || c.state === "archived") throw new Error("replies_closed");
    const policy = c.replyPolicy ?? "reviewed";
    if (policy === "read-only" || policy === "private-contact") throw new Error("replies_closed");
    if (policy === "members" && !this.isMember(input.channelId)) throw new Error("members_only");
    await getTalkSecurity().sealForConversation(input.channelId, input.body);
    const reply: ChannelReply = {
      id: uid("creply"),
      channelId: input.channelId,
      origin: input.origin,
      fromLabel: input.fromLabel || (input.origin === "anonymous" ? "someone" : "guest"),
      fromAddress: input.origin === "place" ? input.fromAddress : undefined,
      body: input.body,
      attachments: input.attachments ?? [],
      status: policy === "reviewed" ? "pending" : "published",
      createdAt: new Date().toISOString(),
      privacy: PLANNED_PRIVATE,
      protocolVersion: P,
    };
    this.state.channelReplies = [reply, ...this.state.channelReplies];
    if (reply.status === "published") this.appendReplyAsMessage(c, reply);
    this.persist();
    return delay({ status: reply.status });
  }

  async listPendingReplies(channelId: string): Promise<ChannelReply[]> {
    return delay(this.state.channelReplies.filter((r) => r.channelId === channelId && r.status === "pending"));
  }

  async publishReply(replyId: string): Promise<void> {
    const reply = this.state.channelReplies.find((r) => r.id === replyId);
    if (reply && reply.status === "pending") {
      reply.status = "published";
      const c = this.conv(reply.channelId);
      if (c) this.appendReplyAsMessage(c, reply);
    }
    this.persist();
    return delay(undefined);
  }

  async declineReply(replyId: string): Promise<void> {
    const reply = this.state.channelReplies.find((r) => r.id === replyId);
    if (reply) reply.status = "declined";
    this.persist();
    return delay(undefined);
  }

  async replyPrivatelyToReply(replyId: string, body: string): Promise<Conversation> {
    const reply = this.state.channelReplies.find((r) => r.id === replyId);
    if (!reply || reply.origin !== "place" || !reply.fromAddress) throw new Error("no_reply_path");
    const channel = this.conv(reply.channelId);
    const owner = channel?.placeAddress ?? reply.fromAddress;
    const conv: Conversation = {
      id: uid("conv"),
      kind: "direct",
      placeAddress: owner,
      title: reply.fromLabel,
      subtitle: `talk.kodama.page/${reply.fromAddress}`,
      mark: markFor(reply.fromLabel, reply.fromAddress),
      members: [member(owner), member(reply.fromLabel, "member", reply.fromAddress)],
      lastMessagePreview: body,
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      pinned: false,
      muted: false,
      state: "active",
      protocolVersion: P,
    };
    this.state.conversations = [conv, ...this.state.conversations];
    this.state.messages[conv.id] = [
      seedMsg(uid("m"), conv.id, reply.fromLabel, false, reply.body, reply.createdAt),
      seedMsg(uid("m"), conv.id, "You", true, body, new Date().toISOString()),
    ];
    reply.status = "published"; // resolved out of the review queue
    this.persist();
    return delay(conv);
  }

  /* ── Follow (device-local) ── */

  private readList(key: string): string[] {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(window.localStorage.getItem(key) ?? "[]") as string[]; } catch { return []; }
  }
  private writeList(key: string, list: string[]): void {
    if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(Array.from(new Set(list))));
  }

  isFollowing(channelAddress: string): boolean {
    return this.readList(FOLLOW_KEY).includes(channelAddress);
  }
  followChannel(channelAddress: string): void {
    this.writeList(FOLLOW_KEY, [...this.readList(FOLLOW_KEY), channelAddress]);
  }
  unfollowChannel(channelAddress: string): void {
    this.writeList(FOLLOW_KEY, this.readList(FOLLOW_KEY).filter((a) => a !== channelAddress));
  }
  async listFollowedChannels(): Promise<Conversation[]> {
    const follows = this.readList(FOLLOW_KEY);
    return delay(this.state.conversations.filter((c) => c.kind === "channel" && follows.includes(this.channelAddress(c))));
  }

  /* ── Membership (invite-based, device-local) ── */

  isMember(channelId: string): boolean {
    const c = this.conv(channelId);
    if (!c) return false;
    return this.readList(MEMBER_KEY).includes(this.channelAddress(c));
  }
  joinChannelByInvite(channelId: string, code: string): boolean {
    const c = this.conv(channelId);
    if (!c) return false;
    const ok = this.state.invites.some((i) => i.conversationId === channelId && i.code === code);
    if (!ok) return false;
    this.writeList(MEMBER_KEY, [...this.readList(MEMBER_KEY), this.channelAddress(c)]);
    return true;
  }

  async listMembers(id: string): Promise<Member[]> {
    return delay(this.conv(id)?.members ?? []);
  }

  async removeMember(id: string, label: string): Promise<void> {
    const c = this.conv(id);
    if (c) {
      c.members = c.members.filter((m) => m.label !== label);
      await getTalkSecurity().rotateKeys(id, "member-removed");
    }
    this.persist();
    return delay(undefined);
  }

  async createInvite(id: string): Promise<Invite> {
    const secret = await getTalkSecurity().mintInvite(id);
    const invite: Invite = {
      id: uid("inv"),
      conversationId: id,
      code: secret.sealed.ciphertext.slice(0, 10),
      label: this.conv(id)?.title ?? "invite",
      createdAt: new Date().toISOString(),
      protocolVersion: P,
    };
    this.state.invites = [invite, ...this.state.invites];
    this.persist();
    return delay(invite);
  }

  /* ── Drafts ── */

  getDraft(id: string): string {
    if (typeof window === "undefined") return "";
    try {
      const all = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? "{}");
      return all[id] ?? "";
    } catch {
      return "";
    }
  }

  saveDraft(id: string, body: string): void {
    if (typeof window === "undefined") return;
    try {
      const all = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? "{}");
      if (body) all[id] = body;
      else delete all[id];
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(all));
    } catch {
      /* ignore */
    }
  }

  /* ── Search ── */

  async search(address: TalkAddress, query: string): Promise<SearchResult> {
    const q = query.trim().toLowerCase();
    if (!q) return delay({ conversations: [], messages: [], drops: [] });
    const conversations = this.state.conversations.filter(
      (c) => c.placeAddress === address && (c.title.toLowerCase().includes(q) || c.lastMessagePreview.toLowerCase().includes(q)),
    );
    const messages = Object.values(this.state.messages).flat().filter((m) => m.body.toLowerCase().includes(q)).slice(0, 12);
    const drops = this.state.incoming.filter((d) => d.toAddress === address && d.body.toLowerCase().includes(q));
    return delay({ conversations, messages, drops });
  }
}

/* helpers */
function member(addressOrLabel: string, role: Member["role"] = "owner", address?: string): Member {
  const label = role === "owner" ? "You" : addressOrLabel;
  return { label, address: role === "owner" ? addressOrLabel : address, role, mark: markFor(label, address ?? addressOrLabel) };
}

function seedMsg(
  id: string,
  conversationId: string,
  authorLabel: string,
  fromOwner: boolean,
  body: string,
  createdAt: string,
  replyTo?: Message["replyTo"],
): Message {
  return {
    id,
    conversationId,
    authorLabel,
    fromOwner,
    body,
    attachments: [],
    reactions: [],
    replyTo,
    createdAt,
    privacy: PLANNED_PRIVATE,
    protocolVersion: P,
  };
}
