# Group & Channel Protocol

`protocolVersion: "kodama-talk/v1"`

Groups and Channels are optional communication forms within the one Talk
product — not separate apps. They open into the same **Stream**.

## Group

- **Always private**, **always invite-only**, **never publicly discoverable**.
- Created by an owner from their place; members join via a sealed **Invite**.
- Removing a member triggers a **key rotation** (`rotateKeys("member-removed")`)
  so the departing member cannot read future messages.

```ts
Conversation { kind: "group", members: Member[], state, pinned, muted, ... }
```

## Channel

A place for updates and discussion. Still communication — never a social feed.

- `visibility`: `"public"` | `"private"` (private is invite-only).
- `replyPolicy`: `"open"` (anyone) | `"owner-only"` | `"off"`.
- Publishing permission is derived from `Member.role` (`owner` | `publisher`).

```ts
Conversation {
  kind: "channel",
  visibility: "public" | "private",
  replyPolicy: "open" | "owner-only" | "off",
  ...
}
```

## Reply / publish gating (UI)

- `state === "locked" | "archived"` → composer disabled with a clear reason.
- Channel `replyPolicy === "off"` → composer replaced by a quiet notice.
- These are UI affordances; the backend enforces the real permission.

## Service surface

- `createGroup`, `createChannel`
- `listMembers`, `removeMember`
- `createInvite`
- shared: `getConversation`, `listMessages`, `sendMessage`, `setPinned`,
  `setMuted`, `setArchived`, `setLocked`, `deleteConversation`
