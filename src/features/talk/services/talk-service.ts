/**
 * TalkService — the single boundary the centralized backend will replace.
 * Every screen depends only on this interface. `MockTalkService` implements it
 * against local state today; a `RemoteTalkService` will implement it against the
 * centralized, zero-knowledge Kodama backend later. Nothing else changes.
 */

import type {
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
  TalkAddress,
} from "@/features/talk/types";

export interface TalkService {
  /* Door */
  resolvePlace(address: TalkAddress): Promise<Place | null>;
  claimAddress(input: ClaimAddressInput): Promise<Place>;
  sendDrop(input: SendDropInput): Promise<Drop>;

  /* Owner */
  unlockOwner(address: TalkAddress, password: string, remember: boolean): Promise<OwnerSession | null>;
  rememberedSession(address: TalkAddress): OwnerSession | null;
  /** Live owner session, restored across a page refresh (until lock / tab close). */
  activeSession(address: TalkAddress): OwnerSession | null;
  beginSession(session: OwnerSession, persist?: boolean): void;
  endSession(address: TalkAddress): void;
  forgetDevice(address: TalkAddress): void;
  getShelf(session: OwnerSession): Promise<Shelf>;
  updatePlace(address: TalkAddress, patch: Partial<Pick<Place, "displayName" | "tagline" | "dropReceiving" | "doorNote">>): Promise<Place>;
  getNotificationPrefs(address: TalkAddress): Promise<NotificationPrefs>;
  setNotificationPrefs(address: TalkAddress, prefs: NotificationPrefs): Promise<void>;

  /* Drops */
  replyToDrop(dropId: string, body: string): Promise<Conversation>;
  declineDrop(dropId: string): Promise<void>;
  blockDrop(dropId: string): Promise<void>;

  /* Conversations */
  listConversations(address: TalkAddress): Promise<Conversation[]>;
  getConversation(conversationId: string): Promise<Conversation | null>;
  listMessages(conversationId: string): Promise<Message[]>;
  sendMessage(input: SendMessageInput): Promise<Message>;
  addReaction(messageId: string, emoji: string): Promise<void>;
  markRead(conversationId: string): Promise<void>;
  setPinned(conversationId: string, pinned: boolean): Promise<void>;
  setMuted(conversationId: string, muted: boolean): Promise<void>;
  setArchived(conversationId: string, archived: boolean): Promise<void>;
  setLocked(conversationId: string, locked: boolean): Promise<void>;
  deleteConversation(conversationId: string): Promise<void>;

  /* Groups & Channels */
  createGroup(input: CreateGroupInput): Promise<Conversation>;
  createChannel(input: CreateChannelInput): Promise<Conversation>;
  listMembers(conversationId: string): Promise<Member[]>;
  removeMember(conversationId: string, memberLabel: string): Promise<void>;
  createInvite(conversationId: string): Promise<Invite>;

  /* Drafts */
  getDraft(conversationId: string): string;
  saveDraft(conversationId: string, body: string): void;

  /* Search */
  search(address: TalkAddress, query: string): Promise<SearchResult>;
}
