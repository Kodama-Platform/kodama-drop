# Privacy Boundaries

`protocolVersion: "kodama-talk/v1"`

This document draws the line between what stays on the device and what a future
Kodama backend could ever see. It describes the **design**, and is explicit
about what is **not yet true** in the current frontend-only mock.

## The boundary

```
 device  │  network / Kodama
 ────────┼──────────────────────────────
 body    │  (future) ciphertext only
 secrets │  never crosses
 key mat │  never crosses
 address │  visible (it is a public URL)
 metadata│  timestamps, sizes, routing
```

- The **plaintext body, unlock secrets, and key material never cross** the
  boundary in the intended design.
- The **address is public** — it is a shareable URL by definition. Knowing an
  address exists is not a privacy leak.
- Routing metadata (who dropped where, when, approximate size) is minimized but
  not claimed to be zero.

## Current state (mock)

> ⚠️ The frontend-only build does **not** encrypt anything. Messages live in
> `localStorage` as plaintext. Every model reports this honestly via
> `PrivacyStatus { level: "plaintext-mock" }`, and the UI shows a clear
> "Mock — not yet encrypted" pill.

## Intended state (zero-knowledge)

- Bodies and attachments are sealed on the device before send, via the
  **Talk security adapter**, delegating to `kodama-security-core`.
- `PrivacyStatus.level` becomes `"private-planned"` → `"private"` when wired.
- Kodama stores only ciphertext it cannot read.

## Non-negotiables

- Talk feature code must route **all** crypto through
  `security/talk-security-adapter.ts`.
- Talk must never reimplement browser/Node cryptography.
- The UI must never present a stronger privacy claim than the adapter reports.
