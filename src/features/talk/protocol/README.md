# Kodama Talk — Frontend Protocol

`protocolVersion: "kodama-talk/v1"`

Kodama Talk is a **URL-native communication product**: one address, one purpose,
no account. This folder documents the frontend contract the UI is built against
today, and the boundary the centralized Kodama backend will implement later.

## The three experiences

1. **The Door** — a person types a Talk address (`talk.kodama.page/alex`) or
   opens one through a URL. Visitors can send a **Drop** in seconds, no account.
2. **The Shelf** — the owner unlocks their own address and sees what needs
   attention: incoming Drops, pinned conversations, and sent Drops.
3. **The Stream** — any Drop, Direct Talk, Group, or Channel opens into the same
   focused conversation page.

## Principles

- One URL. One purpose. No account.
- A Talk address is a **place**, not a username.
- A visitor should be able to send a Drop in seconds.
- An owner should see what needs attention immediately.
- Private communication is designed for **future zero-knowledge encryption**.
- Cryptographic complexity is never exposed in ordinary user flows.
- Groups and Channels are optional extensions, not first-run complexity.

## Architecture boundary

```
UI  ──▶  TalkService (interface)  ──▶  MockTalkService  (today, local state)
                                  └─▶  RemoteTalkService (later, central backend)
```

- `services/talk-service.ts` — the interface every screen depends on.
- `mock/mock-talk-service.ts` — local, seeded, persisted implementation.
- `security/talk-security-adapter.ts` — the **only** place Talk touches crypto.
  Talk never imports `@kodama.page/security-browser` directly.

## Versioning

Every security-sensitive model carries `protocolVersion: "kodama-talk/v1"`
(`Drop`, `Message`, `OwnerSession`, `Place`, `SealedPayload`). The backend can
reject or migrate unknown versions instead of guessing.

## Documents

- [`drop-protocol.md`](./drop-protocol.md)
- [`owner-unlock-protocol.md`](./owner-unlock-protocol.md)
- [`pinned-shelf-protocol.md`](./pinned-shelf-protocol.md)
- [`message-format.md`](./message-format.md)
- [`group-channel-protocol.md`](./group-channel-protocol.md)
- [`invites-membership.md`](./invites-membership.md)
- [`privacy-boundaries.md`](./privacy-boundaries.md)
- [`security-claims.md`](./security-claims.md)
