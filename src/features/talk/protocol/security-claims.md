# Security Claims

`protocolVersion: "kodama-talk/v1"`

Honest claims only. Lead with the use; state privacy plainly; never overclaim.

## What we say to users

> Private conversations are encrypted before they reach Kodama. We cannot read
> them.

This is the **intended** guarantee. Until the zero-knowledge boundary is wired
in, the UI must qualify it (see below).

## Claims matrix

| Claim | Intended (ZK) | Current mock |
| --- | --- | --- |
| Bodies encrypted before send | ✅ yes | ❌ no (plaintext, local) |
| Kodama can read messages | ❌ no | n/a (no server) |
| Account required | ❌ no | ❌ no |
| Address is public | ✅ yes (by design) | ✅ yes |
| Unlock secret leaves device | ❌ never | ❌ never (no network) |
| Independent audit | ⏳ pending | ⏳ pending |

## Rules for the UI

1. Every screen that shows a message shows a `PrivacyStatus`. The claim shown
   must equal what `getTalkSecurity().describePrivacy()` returns — no stronger.
2. In the mock, show **"Mock — not yet encrypted"** wherever privacy is implied.
3. Never expose keys, ciphertext, or KDF parameters in ordinary flows.

## What we cannot do (by design)

- Recover a lost unlock secret — there is nothing to reset in the ZK design.
- Read message contents once encryption is enabled.
- Prove who a `fromLabel` really is — labels are presentational, not identity.

## Versioning & migration

`protocolVersion` gates every security-sensitive payload. A backend receiving an
unknown version must reject or migrate — never silently reinterpret.
