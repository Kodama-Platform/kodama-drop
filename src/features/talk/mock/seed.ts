import type { Conversation, Drop, Member, Message, Place } from "@/features/talk/types";
import { TALK_PROTOCOL_VERSION } from "@/features/talk/types";
import { markFor } from "@/features/talk/lib/mark";
import { PLANNED_PRIVATE } from "@/features/talk/security/talk-security-adapter";

const now = Date.now();
const ago = (mins: number) => new Date(now - mins * 60_000).toISOString();
const P = TALK_PROTOCOL_VERSION;

const member = (label: string, role: Member["role"], address?: string): Member => ({
  label,
  address,
  role,
  mark: markFor(label, address ?? label),
});

export const SEED_PLACES: Place[] = [
  {
    address: "alex",
    displayName: "Alex Rivera",
    tagline: "Building quiet software. Drop me a message.",
    doorNote: "Replies may be slow this week — Drops always welcome.",
    mark: markFor("Alex Rivera", "alex"),
    claimed: true,
    dropReceiving: "open",
    createdAt: ago(60 * 24 * 40),
    protocolVersion: P,
  },
  {
    address: "studio",
    displayName: "North Studio",
    tagline: "A small design practice. Say hello.",
    mark: markFor("North Studio", "studio"),
    claimed: true,
    dropReceiving: "open",
    createdAt: ago(60 * 24 * 12),
    protocolVersion: P,
  },
];

export const SEED_INCOMING: Drop[] = [
  {
    id: "drop-1",
    toAddress: "alex",
    origin: "place",
    fromLabel: "Mara",
    fromAddress: "mara",
    subject: "A short chat next week?",
    body: "Loved your essay on quiet tools. Would you be open to a short chat next week?",
    attachments: [],
    status: "delivered",
    createdAt: ago(22),
    privacy: PLANNED_PRIVATE,
    protocolVersion: P,
  },
  {
    id: "drop-2",
    toAddress: "alex",
    origin: "anonymous",
    fromLabel: "someone",
    body: "No account, no fuss — this is exactly what I wanted. Thank you for building it.",
    attachments: [],
    status: "delivered",
    createdAt: ago(140),
    privacy: PLANNED_PRIVATE,
    protocolVersion: P,
  },
  {
    id: "drop-3",
    toAddress: "alex",
    origin: "named",
    fromLabel: "Devon",
    subject: "Sketch v2 — which option?",
    body: "Sketch attached — thoughts on the second option?",
    attachments: [{ id: "att-1", name: "sketch-v2.png", kind: "image", sizeLabel: "240 KB", sealed: true }],
    status: "delivered",
    createdAt: ago(300),
    privacy: PLANNED_PRIVATE,
    protocolVersion: P,
  },
];

export const SEED_SENT: Drop[] = [
  {
    id: "sent-1",
    toAddress: "mara",
    origin: "place",
    fromLabel: "Alex Rivera",
    fromAddress: "alex",
    body: "Next Tuesday works. I'll send a time.",
    attachments: [],
    status: "accepted",
    createdAt: ago(15),
    privacy: PLANNED_PRIVATE,
    protocolVersion: P,
  },
  {
    id: "sent-2",
    toAddress: "kodama",
    origin: "anonymous",
    fromLabel: "someone",
    fromAddress: "alex",
    body: "Small typo on your about page — last paragraph.",
    attachments: [],
    status: "delivered",
    createdAt: ago(60 * 30),
    privacy: PLANNED_PRIVATE,
    protocolVersion: P,
  },
];

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-mara",
    kind: "direct",
    placeAddress: "alex",
    title: "Mara",
    subtitle: "talk.kodama.page/mara",
    mark: markFor("Mara", "mara"),
    members: [member("Alex Rivera", "owner", "alex"), member("Mara", "member", "mara")],
    lastMessagePreview: "Next Tuesday works. I'll send a time.",
    lastMessageAt: ago(15),
    unreadCount: 0,
    pinned: true,
    muted: false,
    state: "active",
    protocolVersion: P,
  },
  {
    id: "conv-devon",
    kind: "direct",
    placeAddress: "alex",
    title: "Devon",
    subtitle: "from a Drop",
    mark: markFor("Devon", "devon"),
    members: [member("Alex Rivera", "owner", "alex"), member("Devon", "member")],
    lastMessagePreview: "Sketch attached — thoughts on the second option?",
    lastMessageAt: ago(300),
    unreadCount: 1,
    pinned: false,
    muted: false,
    state: "active",
    protocolVersion: P,
  },
  {
    id: "conv-design-team",
    kind: "group",
    placeAddress: "alex",
    title: "Design Team",
    subtitle: "4 members · private",
    mark: markFor("Design Team", "design-team"),
    members: [
      member("Alex Rivera", "owner", "alex"),
      member("Mara", "member", "mara"),
      member("Devon", "member"),
      member("Wren", "member", "wren"),
    ],
    lastMessagePreview: "Wren: let's ship the calmer palette.",
    lastMessageAt: ago(90),
    unreadCount: 3,
    pinned: true,
    muted: false,
    state: "active",
    protocolVersion: P,
  },
  {
    id: "conv-field-notes",
    kind: "channel",
    placeAddress: "alex",
    title: "Field Notes",
    subtitle: "Public channel",
    mark: markFor("Field Notes", "field-notes"),
    members: [member("Alex Rivera", "owner", "alex")],
    lastMessagePreview: "This week: on building for calm.",
    lastMessageAt: ago(60 * 20),
    unreadCount: 0,
    pinned: true,
    muted: false,
    state: "active",
    visibility: "public",
    replyPolicy: "open",
    protocolVersion: P,
  },
];

const msg = (
  id: string,
  conversationId: string,
  authorLabel: string,
  fromOwner: boolean,
  body: string,
  mins: number,
  extra: Partial<Message> = {},
): Message => ({
  id,
  conversationId,
  authorLabel,
  fromOwner,
  body,
  attachments: [],
  reactions: [],
  createdAt: ago(mins),
  privacy: PLANNED_PRIVATE,
  protocolVersion: P,
  ...extra,
});

export const SEED_MESSAGES: Record<string, Message[]> = {
  "conv-mara": [
    msg("m1", "conv-mara", "Mara", false, "Loved your essay on quiet tools. Would you be open to a short chat next week?", 22),
    msg("m2", "conv-mara", "Alex Rivera", true, "Next Tuesday works. I'll send a time.", 15, {
      replyTo: { messageId: "m1", authorLabel: "Mara", excerpt: "Would you be open to a short chat…" },
      reactions: [{ emoji: "🌿", by: "Mara" }],
    }),
  ],
  "conv-devon": [
    msg("d1", "conv-devon", "Devon", false, "Sketch attached — thoughts on the second option?", 300, {
      attachments: [{ id: "att-1", name: "sketch-v2.png", kind: "image", sizeLabel: "240 KB", sealed: true }],
    }),
  ],
  "conv-design-team": [
    msg("g1", "conv-design-team", "Mara", false, "Palette review at 3?", 180),
    msg("g2", "conv-design-team", "Devon", false, "Works for me.", 150),
    msg("g3", "conv-design-team", "Wren", false, "let's ship the calmer palette.", 90, { reactions: [{ emoji: "✨", by: "Alex Rivera" }] }),
  ],
  "conv-field-notes": [
    msg("c1", "conv-field-notes", "Alex Rivera", true, "This week: on building for calm. A short note on why fewer notifications made everything feel lighter.", 60 * 20),
  ],
};
