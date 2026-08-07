# Pinned Shelf Protocol

`protocolVersion: "kodama-talk/v1"`

The **Shelf** is the owner's single view of what needs attention. It has three
sections and nothing else:

1. **Incoming Drops** — new one-way messages, newest first.
2. **Pinned** — conversations/places the owner keeps close.
3. **Sent Drops** — Drops the owner sent to other places.

## Model

```ts
interface Shelf {
  address: TalkAddress;
  incoming: Drop[];
  pinned: Conversation[];
  sent: Drop[];
}
```

## Pinning

- Pinning is per-conversation and owned by the place owner.
- `TalkService.setPinned(conversationId, pinned)` toggles it.
- Pins are ordered by most recent activity; the UI never reorders by hand in v1.

## Rules

- The Shelf must let the owner see what needs attention **immediately** — unread
  activity glows gently (a firefly), it never flashes or badges aggressively.
- Empty states are welcoming, never blank: the communication pane is never left
  empty (see visual direction).
- Groups and Channels appear on the Shelf only once created — they are not
  first-run complexity.

## Service surface

- `TalkService.getShelf(session): Promise<Shelf>`
- `TalkService.setPinned(conversationId, pinned): Promise<void>`
