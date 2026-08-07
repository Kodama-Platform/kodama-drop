# Invites & Membership

`protocolVersion: "kodama-talk/v1"`

How people join private conversations (Groups, private Channels, Direct Talks)
without accounts, and how membership secrets are modelled for the future
zero-knowledge backend.

## Invite

```ts
interface Invite {
  id: string;
  conversationId: string;
  code: string;        // short handle in the link: talk.kodama.page/join/<code>
  label: string;
  createdAt: string;
  expiresAt?: string;
  protocolVersion: "kodama-talk/v1";
}
```

- An invite carries a sealed **InviteSecret** (see security adapter), never a raw
  membership key.
- Invites may expire (`expiresAt`) → the UI shows an **expired** state.
- Joining via an invite mints a per-member **MembershipCredential**.

## Membership credential (modelled)

```ts
interface MembershipCredential {
  protocolVersion: "kodama-talk/v1";
  conversationId: string;
  memberRef: string;
  sealed: SealedPayload;
}
```

## Key rotation

- Removing a member calls `rotateKeys(conversationId, "member-removed")`,
  advancing the conversation's key **epoch**. Prior members lose forward access.
- Rotation can also be `"manual"` or `"scheduled"`.

## Rules

- Invite secrets, membership credentials, and key material are all handled by the
  **Talk security adapter** only — never by feature code.
- The mock frontend generates opaque placeholder codes and does **not** perform
  real sealing (see privacy-boundaries.md).

## Service surface

`createInvite(conversationId)` · `listMembers` · `removeMember`
