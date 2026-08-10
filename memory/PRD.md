# Kodama Talk — PRD & Build Log

## Product
Kodama Talk: a URL-native, accountless communication product. "One URL. One purpose. No account."
A Talk address (talk.kodama.page/alex) is a *place*, not a username. Three experiences:
- **The Door** — a visitor sends a *Drop* (no account).
- **The Shelf** — the owner unlocks their address and manages incoming Drops, Direct Talks, Groups, Channels, Sent, and Pinned.
- **The Stream** — every conversation opens into one focused page.

Built on the Kodama Note repo (kept build/runtime config, dusk theme, brand assets, security-core adapter). Note UI fully replaced with Talk.

## Stack / Runtime
- Vite 8 + React 19 + TypeScript + TanStack Router (file-based, autoCodeSplitting), Tailwind v4.
- App root at `/app` (NOT CRA). Dev served on :3000 via a launcher at `/app/frontend/package.json` (supervisor `frontend` runs `yarn start` → `cd /app && vite --host 0.0.0.0 --port 3000`). No Python backend (frontend-only).
- Display font switched to **Fraunces** (headings/place names); Outfit sans for communication.

## Architecture (single backend-swap boundary)
- `src/features/talk/services/talk-service.ts` — `TalkService` interface (the one seam).
- `src/features/talk/services/index.ts` — `talkService` singleton (currently `MockTalkService`).
- `src/features/talk/mock/` — `MockTalkService` + seed (local state, persisted to localStorage `kodama-talk/v1/*`). No network, no real crypto.
- `src/features/talk/security/talk-security-adapter.ts` — the ONLY place Talk touches crypto; models future ZK (SealedPayload, OwnerCredential, InviteSecret, MembershipCredential, KeyRotation). Mock is honest: privacy pill shows "Mock — not yet encrypted".
- `src/features/talk/protocol/` — README, drop-protocol, owner-unlock-protocol, pinned-shelf-protocol, message-format, group-channel-protocol, invites-membership, privacy-boundaries, security-claims. Every security-sensitive model carries `protocolVersion: "kodama-talk/v1"`.
- `src/features/talk/{components,screens,store,types,lib}`.

## Routes
- `/` — Landing Door (marketing + address plaque → navigates to /:address).
- `/$address` — Door: unclaimed → Claim; claimed → visitor Drop composer (anonymous / named / from-place) + "This is me" → Unlock → owner **Shelf** (rendered in-page). Invalid slug → error state.

## Implemented (2026-06)
- Door: resolve place, claim address (owner password, device-remembered), send Drop (3 origins), drop-sent success + growth-loop CTA, closed-receiving state.
- Owner unlock (remembered device / forget device), Shelf interior: nav (Drops, Direct, Groups, Channels, Pinned, Sent), search, settings, lock.
- Drops: reply (→ converts to Direct Talk), decline, block; Sent Drops with anonymous/place labelling.
- Stream: messages, reactions, reply/thread ref, attachments preview, drafts, pin/mute/archive, locked/channel-reply-off states, privacy pill.
- Groups (private, invite-only) + Channels (public/private, reply policy) creation; invite links; member/key-rotation model.
- Settings (identity, tagline, drop-receiving, notification prefs), Search, light/dark theme.
- Empty/loading/error/unavailable/blocked/archived/locked states.

## Verification
- jsdom smoke tests (4) pass: `src/features/talk/__smoke__.test.tsx`.
- Production `vite build` clean (heavy WASM crypto stays in async chunks).
- Testing agent: 13/13 UX flows pass in a real browser; all screens render (no blank); all testids functional. (Blank screenshot harness = headless compositor + entrance-animation timing; reduced-motion fallback added.)

## Update (2026-06, iteration 2) — Reachability & sharing
- **Share your Door**: `open-share` in Shelf → `ShareDoorSheet` (share-door.tsx) with copy link, local **QR** (qrcode lib), and a **downloadable share card** drawn on `<canvas>`; native share when available. Also a first-run `empty-share-door` CTA in the Drops empty state.
- **Reframed Door**: invitation-led headline ("Drop {name} a message"), autofocused composer, slim identity, `door-consent` line ("you can stay anonymous — no account needed").
- **Tap-to-copy address plaque** everywhere (readonly `TalkAddressPlaque` is now a copy button) with a robust clipboard fallback (`lib/clipboard.ts`, used by plaque, share, invite).
- **Door Note** (#3): `Place.doorNote` shown to visitors (`door-note`), editable in Settings (`settings-doornote`); seeded on `alex`.
- Verified by testing agent (iteration_2.json): 13/13 targeted checks pass in a real browser; QR + canvas render; only note is headless clipboard restriction (now has execCommand fallback).

## Update (2026-06, iteration 3) — Sealed Key Card
- New security model `RecoveryKey` + `mintRecoveryKey(address)` in `talk-security-adapter.ts` (deterministic grouped code in the mock; placeholder for real security-core recovery).
- `components/key-card.tsx` (`KeyCardSheet`): calm copy, copyable recovery code, and a **downloadable Key Card** (canvas PNG with place-mark, address, code, and honest "no account / no reset — keep it safe" framing).
- Shown at **claim time as a must-acknowledge gate** (checkbox → "Enter my place") before the Shelf opens; re-downloadable anytime from **Settings → Recovery key card** (`settings-key-card`).
- Verified: jsdom flow test added (claim → gated key card → shelf); 5/5 smoke tests pass; clean production build.

## Update (2026-06, iteration 4) — Email-like Drops: lightweight Markdown + page purpose
- **Lightweight Markdown** (`lib/markdown.tsx`): dependency-free, HTML-escaped, only http(s) links. Supports `# ## ###` headings, `**bold**`, `_italic_`, `` `code` ``, `[links](url)`, `> quotes`, and `-`/`1.` lists. Rendered via `.md` styles in `talk.css`.
- **Door composer** now has a quiet **Write / Preview** toggle (`door-write-tab` / `door-preview-tab` → `door-preview`) — no heavy toolbar; keeps the note/email feel. Preview is guarded on empty body.
- **Markdown on read**: `message-fragment.tsx` renders message bodies as Markdown.
- **Page-purpose captions** (subtle one-line, under each title): Landing `landing-purpose` "Find or claim a place for messages."; Shelf `shelf-purpose` "Decide what becomes a conversation."; Stream `stream-purpose` (direct → "A private conversation that began with a Drop"; group/channel → subtitle or kind purpose).
- Verified: 151/151 unit tests pass, clean production build, testing agent iteration_3 → 26/26 browser checks pass (headings/bold/italic/code/safe links/quotes/lists render as real HTML in door-preview + message bubbles; captions present; Door send + owner unlock regression intact).

## Update (2026-06, iteration 5) — Reply Preview
- The in-conversation reply composer (`drop-composer.tsx`) now has the same quiet **Write / Preview** toggle as the Door. Tabs appear only once there's text; Preview renders the same safe Markdown; submit clears and resets to Write mode.
- Testids: `drop-composer-writemode`, `drop-composer-write-tab`, `drop-composer-preview-tab`, `drop-composer-preview`.
- Verified: clean build + testing agent iteration_4 → **30/30** browser checks (empty hint, tabs on text, real-HTML preview with safe links, Write preserves text, send clears/resets, sent bubble renders Markdown, plain-send + Enter-to-send regressions intact).

## Update (2026-06, iteration 6) — Draft Keeping (per-conversation)
- The reply composer (`drop-composer.tsx`) now accepts an optional `draftKey` and persists unsent replies per conversation via the existing `talkService.getDraft/saveDraft` (localStorage `kodama-talk/v1/drafts` map keyed by conversation id). Wired in `stream-view.tsx` and `conversation-stream.tsx` with `draftKey={conversation.id}`.
- Behavior: draft survives switching between conversations (no bleed) and full page reload; cleared on send; empty for conversations with no draft. Write/Preview + Enter-to-send unaffected by restored drafts.
- Verified: clean build + testing agent iteration_5 → **13/13** browser checks pass.

## Update (2026-06, iteration 7) — Door redesign (focus + simplicity)
- Fixed reported UX: the visitor Door (`door-screen.tsx` DoorView) felt scattered, "This is me" was buried, and the recipient was unclear.
- Now leads with a focused "knocking at a door" identity header (eyebrow "You're knocking at" + larger place-mark + name + tap-to-copy address + italic tagline + door note), a thin threshold divider, then a single "Leave {name} a note" composer as the sole focus.
- Removed the verbose Markdown hint paragraph (Write/Preview tabs communicate it). Separated the competing footer signals: consent + privacy pill stay by the send action; the owner path is now a clearly visible bordered pill "This is my place — unlock it" (`this-is-me`) below a divider.
- Verified: clean build + testing agent iteration_6 → 100% pass (identity clear, single focus, this-is-me prominent/opens unlock; drop-send + origins + owner unlock + unclaimed-claim regressions intact).

## Backlog / Next (P1)
- Wire real zero-knowledge via `talk-security-adapter` + a `RemoteTalkService` (replace the one boundary).
- Real attachment upload/preview; message search highlighting; archive/expired invite management screens.
- URL-native deep links for individual streams (`/$address/c/$id`) and join links (`/join/$code`).
- Optimistic send + unread realtime once backend lands.
