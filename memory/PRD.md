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

## Update (2026-06, iteration 8) — Drop Subjects + Sent Confirmation polish
- **Drop Subjects**: optional one-line subject on Drops (`Drop.subject`, `SendDropInput.subject`). Door composer has a subtle top-of-paper `door-subject` input ("Add a subject (optional)"). Owner Drops now scan like an inbox — subject shows as a prominent title line (`drop-subject-{id}`); Drops without a subject still render the body. Seeded: drop-1 "A short chat next week?", drop-3 "Sketch v2 — which option?", drop-2 has none.
- **Sent Confirmation polish**: warmer, clearly one-tap-done success card — animated seal (`drop-sent-seal`), "Tucked under {name}'s door", the subject echoed in italics (`drop-sent-subject`), a clear primary `drop-done`, plus quiet `drop-another` + "Get a place of your own". Done returns to a cleared composer.
- Verified: clean build + 5/5 smoke tests + testing agent iteration_7 → **21/21** browser checks pass (incl. optional-subject, inbox scan, end-to-end new subject, polished sent state, and Write/Preview + origins + unlock + reply-to-drop regressions).

## Update (2026-06, iteration 9) — True-merged hero (DoorHero)
- The landing hero and the door identity header are now ONE shared component `components/door-hero.tsx` (`DoorHero`) with two modes: `entry` (landing `/`) and `place` (`/:address`). Same skeleton (eyebrow → place-mark → name → address plaque → extras). Routes/URLs unchanged; landing stays the canonical home.
- Entry mode is live: the place-mark is dimmed until you type; typing a name lights the mark and sets the title to the forming slug (`landing-title`), keeping `landing-purpose`, `landing-helper`, `claim-address-btn`. Place mode keeps `door-place-name`, tap-to-copy plaque, tagline, `door-note`.
- Landing's below-hero content (3 cards + privacy pitch) and the Door composer flow (subject, Write/Preview, origins, send, this-is-me) are unchanged.
- Verified: clean build + 5/5 smoke tests + testing agent iteration_8 → 100% pass on both routes + regressions (drop send/subjects/sent-polish, unlock, reply-to-drop, unclaimed claim path).

## Update (2026-06, iteration 10) — Refresh fix + full audit
- **Refresh bug (root cause)**: owner session lived only in React state, so reloading the Shelf/Stream logged the owner out. Fixed by persisting the active session in `sessionStorage` (`kodama-talk/v1/session:<addr>`): `activeSession`/`beginSession`/`endSession` on the service; DoorScreen restores it on mount, `openShelf` begins it, `lock`/`forgetDevice` end it. Refresh now keeps the owner in place; lock clears it; sessions are per-address.
- **Data fix**: `getShelf` Sent list now filters by `fromAddress === owner` (previously leaked every anonymous sent Drop to all owners); seeded anonymous sent Drop attributed to `alex`.
- **Polish from audit**: Key Card claim gate CTA (ack + Continue) is now a sticky footer so it's never below the fold on laptop viewports; added `data-testid="theme-toggle"`.
- Full audit (testing agent iteration_9): **100%** of tested flows pass across Door/claim/key-card/unlock/refresh, Shelf nav, Drops reply/decline/block, Direct Talks, Groups/Channels, invites, search, settings, share, drafts, markdown, reactions/threads, sent list. No functional defects found. Verified additionally by clean build + 5/5 smoke tests.

## Update (2026-06, iteration 11) — Stay signed in
- Opt-in **"Keep me signed in on this device"** (UnlockView checkbox `unlock-remember`, default on, honest "uncheck on a shared computer" note). When on, the session is persisted to localStorage (`kodama-talk/v1/stay:<addr>`) so returning owners (new tab / after closing) land straight in the Shelf — no password. Claiming implies stay. When off, session is sessionStorage-only (survives refresh, not tab close) and the remembered credential is removed.
- `activeSession` reads sessionStorage then the stay key; `beginSession(session, persist)`; `endSession` clears both; **Lock always signs out** (clears session + stay, keeps the device-remembered "Welcome back" button which still requires the password).
- Verified: clean build + 5/5 smoke tests + testing agent iteration_10 → **100%** (default-ON return, lock sign-out, opt-out, claim-implies-stay, + drop/shelf/theme regressions).

## Update (2026-06, iteration 16) — Conversation Trail + universal surface + live landing
- **Universal surface** (`talk-surface.tsx`): root `/` and `/:address` share one in-place surface. Root resolves typed addresses LIVE (debounced 350ms) with a fetching/available/owned status; owned reveals the Drop form, available reveals the Claim form — no route/URL change. Owner unlock is a sheet (`UnlockSheet`). Direct links still open the Door immediately. `DoorView`/`ClaimView` are reusable; `DoorView` gains `showHero`.
- **Conversation Trail** (`message-fragment.tsx`, `stream-view.tsx`, `thread-reference.tsx`, `.trail-*` CSS): messages sit along a quiet vertical trace (stem + node), clustered by speaker (name once per cluster), owner=moss edge / others=warm paper (no left/right bubbles). First-Drop context line, reply echoes that jump to the original (with flash), edge ember reactions, one unread firefly divider (no red dots), "Leave a message…" composer, and a read-only-channel permission state. Same trail for Direct/Group/Channel.
- Fixed a StrictMode double-effect bug where `markRead` zeroed the unread count before render (now captured once per conversation id in `seenUnread`).
- Verified: clean build + 9/9 jsdom tests + testing agent iterations 12–15 (universal surface, live landing, trail, unread firefly, read-only channel) all 100%.

## Update (2026-06, iteration 17) — Dynamic address-field landing (full entry flow)
- The landing IS the whole entry flow via one address field. Debounced (400ms) lookup with stale-response cancellation shows a status chip: Checking address… / Claimed / Available / Your Talk / Unavailable. Layout is height-stable; browser URL never changes on typed lookups.
- States, all in place: empty ("Type a Talk address to reach someone."), Claimed → inline Drop Door (anonymous default + optional "from my place"), Available → Claim form with **confirm password** + honest copy ("This password unlocks this Talk address. Kodama does not store it."), Your Talk → "Open my Talk", owner-unremembered → Drop Door + "This is my place — unlock it" sheet, reserved/invalid → calm "This address cannot be claimed."
- `extractAddress()` normalizes bare names and full/pasted Talk URLs to a place name. Direct URLs still open the claimed Drop Door immediately.
- Verified: clean build + 12/12 jsdom tests (debounce, stale, statuses, anon drop, place-sourced drop, confirm-claim, local-owner, unlock, reserved, pasted URL, URL non-navigation) + testing agent iteration_16 (10 live flows) all 100%.

## Update (2026-06, iteration 18) — Seamless address→place transition
- The landing now feels like one continuous surface. New `SceneFade` component (`src/features/talk/components/scene-fade.tsx`, CSS-only) crossfades the reveal region beneath the stable address field: dissolves the old place out (~170ms), swaps, then unfolds the new one in (~340ms) while animating container height so the surface never jumps.
- The typed address field stays physically stable across every status and morphs into the resolved place's plaque (`talk.kodama.page / name`); mark + display name settle via existing `transition-all`.
- Switching addresses (alex→studio) softly dissolves the old Drop Door/Claim before revealing the new place. Entering the Shelf and the committed Door/Claim/loading views fade in gently via `.talk-enter`.
- `prefers-reduced-motion` → immediate, non-jarring swap (SceneFade skips animation; reduced-motion CSS neutralizes `.talk-scene*`/`.talk-enter` and the height transition). Typed lookups still never change the URL; direct links still work.
- Verified: clean build + 158/158 jsdom tests + testing agent iteration_17 (10 transition flows, field-stability x/width check, Shelf entry + lock) all 100%, no console errors.

## Update (2026-06, iteration 18b) — In-Trail Keepsakes
- Image attachments now render inline in the Conversation Trail as small framed "keepsake" thumbnails with a filename caption (`.talk-keepsake`), feeling like a picture left at the door. Tap opens a quiet lightbox (backdrop/Esc to close). Non-image attachments keep the file chip.
- Owners can leave a picture from the composer: new `allowImages` on `DropComposer` adds an image button + hidden file input; picked images preview as removable chips and can be sent with or without text. Files are downscaled to compact JPEG data URLs (`lib/image.ts`) and stored via the existing MockTalkService/localStorage; `sendMessage` already persists `attachments`.
- Seed conversations gained real keepsakes: Devon (sketch-v2.png), Mara (morning-fog.jpg), Design Team group (palette.png).
- Verified: clean build + 12/12 talk tests + testing agent iteration_18 (100%: thumbnails, lightbox, composer attach/send picture-only, remove chip, text-send + draft regressions, read-only channel has no image button, no console errors).

## Backlog / Next (P1)
- Wire real zero-knowledge via `talk-security-adapter` + a `RemoteTalkService` (replace the one boundary).
- Real attachment upload/preview; message search highlighting; archive/expired invite management screens.
- URL-native deep links for individual streams (`/$address/c/$id`) and join links (`/join/$code`).
- Optimistic send + unread realtime once backend lands.
