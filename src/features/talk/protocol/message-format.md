# Message Format

`protocolVersion: "kodama-talk/v1"`

Every Drop, Direct Talk, Group, and Channel opens into the same **Stream** of
messages. One format serves them all.

## Message

```ts
interface Message {
  id: string;
  conversationId: string;
  authorLabel: string;
  fromOwner: boolean;          // right-aligned in the stream when true
  body: string;                // plain text in v1 (no rich text yet)
  attachments: Attachment[];
  replyTo?: ThreadReference;   // thread/reply anchor
  createdAt: string;           // ISO 8601
  privacy: PrivacyStatus;
  protocolVersion: "kodama-talk/v1";
}
```

## Thread reference

```ts
interface ThreadReference {
  messageId: string;
  authorLabel: string;
  excerpt: string;   // short quote of the referenced message
}
```

## Attachment

```ts
interface Attachment {
  id: string;
  name: string;
  kind: "image" | "file" | "audio" | "link";
  sizeLabel?: string;
  previewUrl?: string;  // mock only; real bytes travel the privacy boundary
}
```

## Rules

- `body` is plain text in v1. Formatting is a future extension, not v1 scope.
- A reply references exactly one message via `ThreadReference` (no nested
  thread trees in v1).
- Message ordering is by `createdAt` ascending within a conversation.
- Attachments are described by metadata; their bytes are subject to the same
  encryption boundary as the body.

## Service surface

- `TalkService.listMessages(conversationId): Promise<Message[]>`
- `TalkService.sendMessage(input: SendMessageInput): Promise<Message>`
