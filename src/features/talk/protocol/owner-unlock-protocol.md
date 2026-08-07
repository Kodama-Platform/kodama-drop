# Owner Unlock Protocol

`protocolVersion: "kodama-talk/v1"`

Unlocking is how a person proves they own a place and reaches the **Shelf**.
It is deliberately quiet — no dashboards, no account chrome.

## Flow

1. Owner opens their own address and chooses **"This is me"**.
2. Owner provides their unlock secret (a passphrase today; a device key /
   capability in the zero-knowledge future).
3. `TalkService.unlockOwner(address, secret)` returns an `OwnerSession` or
   `null`. The session is held in memory only.
4. With a session, the owner can read the Shelf and open Streams.

## Model

```ts
interface OwnerSession {
  address: TalkAddress;
  displayName: string;
  createdAt: string;
  protocolVersion: "kodama-talk/v1";
}
```

## Rules

- Unlock secrets are **never** sent to Kodama in the future ZK design; they
  derive key material locally (delegated to `kodama-security-core`).
- Sessions are ephemeral. There is no long-lived "logged-in" account.
- A failed unlock returns `null` — the UI must not reveal whether the address
  exists or is claimed beyond what the public Door already shows.
- Cryptographic material never appears in ordinary unlock UI copy.

## Service surface

`TalkService.unlockOwner(address, passphrase): Promise<OwnerSession | null>`
