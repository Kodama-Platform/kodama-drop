# Drop Protocol

`protocolVersion: "kodama-talk/v1"`

A **Drop** is the first contact: a one-way message a visitor leaves at a place,
without an account. It is the atomic unit of the growth loop.

## Flow

1. Visitor opens `talk.kodama.page/<address>` (the Door).
2. Visitor writes a message and, optionally, a label for how they want to be
   known. If the visitor has their own Talk address, it is attached as
   `fromAddress` so it can appear as the source of future Drops.
3. On send, the body is passed through the **Talk security adapter**
   (`sealForPlace`) before it would leave the device.
4. The place owner receives the Drop on their **Shelf**. They decide what
   becomes a conversation.

## Model

```ts
interface Drop {
  id: string;
  toAddress: TalkAddress;       // the place it was dropped at
  fromLabel: string;            // e.g. "Mara", "a reader" — may be anonymous
  fromAddress?: TalkAddress;    // present only if the sender owns a place
  body: string;
  attachments: Attachment[];
  status: "sending" | "sent" | "delivered" | "accepted";
  createdAt: string;            // ISO 8601
  privacy: PrivacyStatus;
  protocolVersion: "kodama-talk/v1";
}
```

## Rules

- A Drop requires **no account** from the sender.
- `fromLabel` is presentational trust only — never treated as an identity claim.
- `accepted` means the owner promoted the Drop into a Stream (Direct Talk).
- Attachments follow the same privacy boundary as the body.

## Service surface

`TalkService.sendDrop(input: SendDropInput): Promise<Drop>`
