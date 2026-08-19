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

## Update (2026-06, iteration 19) — Unified activity stream + persistent opt-in
**Persistent opt-in / auto-resume**
- The "Keep me signed in on this device" checkbox now also exists on the Claim flow (`claim-remember`), alongside the existing unlock checkbox. When checked, the Talk is written to a `last-talk` pointer in localStorage.
- On revisiting the root `/` (no direct link), the last opted-in Talk auto-resumes straight into its Shelf — no re-typing or re-unlocking. Locking (or Forget device) clears the pointer so it won't resume. Reopening an already-active session preserves its persistence (`isPersisted`). New service methods: `isPersisted`, `lastOpenedTalk`.

**One living stream (Shelf redesign)**
- Removed the category tab nav (Drops/Talks/Groups/Channels/Pinned/Sent). The Shelf is now a single chronological stream (`shelf-stream`) sorted by latest activity, newest first, mixing Direct Talks, incoming Drops (named = pending direct, anonymous = one-way), Groups, Channels, and Sent Drops (folded in per user's choice).
- Each row: identity mark, name/place, latest preview, time, and only tiny cues — unread firefly (`stream-unread`) / numeric `unread-count`, `cue-group` (people), `cue-channel` (broadcast, lock if private), `pin-mark` (pinned stays in time order, does NOT float), sent = up-right arrow + `SentDropState`, anonymous shows "Anonymous".
- Main panel opens: Conversation Trail (conversation), `drop-detail` (Reply/Decline/Block), or read-only `sent-detail`. Quiet `new-group`/`new-channel` actions replace the old tabs. Mobile back button unified as `detail-back`.
- New component: `stream-item-row.tsx`. `DropCard` gained `onResolved`.
- Verified: clean build + 12/12 talk tests + testing agent iteration_19 (all 12 flows pass, correct newest-first sort, cues, reply→direct-talk conversion, decline removal, mobile; no console errors).

## Update (2026-06, iteration 20) — Full Channel communication model
- **Nested channel URLs**: Channels now have their own public address `talk.kodama.page/{owner}/{slug}` (route `$address_.$channel.tsx`, opted out of the Door layout), distinct from the owner's personal `/{owner}`. Direct link resolves the channel; owner manages inside the Shelf.
- **Visitor public channel page** (`channel-screen.tsx`): read posts, Follow (device-local), "Drop {owner} a private message" link, and a **Drop a reply** composer with send-as **Anonymous / a name / From my Talk address** (place option only when a Talk is unlocked on device; Anonymous shows a one-way hint).
- **Five reply modes** (`ChannelReplyPolicy` redefined): `read-only` (no composer), `reviewed` (DEFAULT public — reply → owner review queue, visitor sees "Awaiting review"), `open` (published instantly, appears in posts), `members` (invite-only can reply; others hit an "Invite required" gate), `private-contact` (no public composer → button to Drop the owner privately). NewChannelSheet exposes all five with the recommended default.
- **Owner Channel view** (`channel-owner-view.tsx`): post updates, Share/Invite/open-public, and a **"Replies waiting for review"** area — Publish (→ public post), Reply privately (Talk-address senders only → becomes a Direct Talk), Decline.
- **Follow & Membership** (device-local, no account): follow/unfollow persist; private channels join via one-time invite link `…?invite=CODE` → local membership so the visitor can read/reply.
- Service additions: `resolveChannel, submitChannelReply, listPendingReplies, publishReply, declineReply, replyPrivatelyToReply, isFollowing/followChannel/unfollowChannel/listFollowedChannels, isMember/joinChannelByInvite`. Seed adds 5 alex channels covering all modes + 2 pending replies. `STORAGE_KEY` bumped to v2 (schema change → fresh seed).
- Verified: clean build (nested route generated) + 12/12 talk tests + testing agent iteration_20 (14/14 channel flows, 100%, no console errors, no bugs).

## Update (2026-06, iteration 21) — Reach/Claim from conversation pages
- Added a quiet "Kodama Talk" footer (`reach-cta.tsx` → `ReachFooter`) to both conversation surfaces: the **Conversation Trail** (`stream-view.tsx`) and the **public Channel page** (`channel-screen.tsx`).
- Two actions: **Leave a Drop** and **Claim a Talk address**, opening a shared `ReachSheet` with a single address field that resolves availability live (reserved / available → claim, claimed → leave a Drop) and navigates to `/{address}` (which shows the Door to drop, or the Claim view if free).
- Verified via build (clean) + 12/12 unit tests + browser screenshots: footer present on both surfaces; drop sheet ("mina" → navigates to /mina), claim sheet ("my-new-place" → "free — claim it"); no errors.

## Update (2026-06, iteration 22) — Owner Shelf lives at its own URL
- Fix: the owner's Shelf (their conversation home) now reflects their place in the browser URL — for alex it's `talk.kodama.page/alex`. Previously entering the Shelf or auto-resuming kept the URL at `/`.
- `talk-surface.tsx`: `openShelf` now navigates to `/{address}` after opening; a mount effect auto-resumes the last opted-in Talk by redirecting root `/` → `/{address}` (replace). Lock keeps the `/{address}` path and swaps to the Door. Direct links unaffected.
- Also fixed earlier (iteration 21): removed the messy combined claim/drop footer that overlapped the conversation pane; replaced with a single clean "Drop" button in the Shelf header (`LeaveDropSheet`, drop-only) → navigates to the recipient's Door.
- Verified: build + 12/12 unit tests + testing agent iteration_22 (5/5 URL flows, 100%, no console errors/redirect loops).

## Update (2026-06, iteration 23) — Landing polish (three states)
- Empty state no longer looks all-grey: the placeholder mark is now a calm Kodama-green blob (primary gradient, organic blob shape, gentle breathing) holding the **Kodama leaf logo** (`KodamaMark`) instead of a grey "?". New `.talk-logo-mark` style; reduced-motion disables the breathe.
- Available and Claimed reveals (Claim form / Drop-message form) keep the existing `SceneFade` fade-in/out + height transition beneath the stable address field.
- Verified: build clean, 12/12 unit tests, browser screenshots of all three states.

## Update (2026-06, iteration 24) — Shelf filter + Drop input
- Added a combined input box at the top of the Shelf rail: it **filters the stream live** (matches conversation titles, group/channel member names/addresses, incoming-drop senders, and sent-to addresses) — e.g. typing "mara" narrows to Mara's Direct Talk, the sent-to-mara drop, the incoming Mara drop, and the Design Team group (member match).
- The input's CTA is captioned **"Drop"** (not "Open"); clicking it or pressing Enter navigates to `talk.kodama.page/{typed}` to leave a Drop. Removed the now-redundant header Drop sheet button.
- Also verified earlier (iteration 23, 100%): owner Shelf URL always reflects the place (`/alex`) across unlock/auto-resume/manual-nav/claim.
- Verified: build + 12/12 unit tests + testing agent iteration_24 (7/7 flows, 100%, no console errors).

## Update (2026-06) — Followed channels, Read receipts, Suggest-as-you-type
- **Followed channels in Shelf**: public channels you follow on other places now appear in your stream (`listFollowedChannels()` merged into `items`, filtered to non-owned; deduped by id). Tapping a followed external channel navigates to its public page `/{place}/{slug}` (you're a visitor there).
- **Read receipts**: a soft "Seen" trace (`read-receipt`, `.trail-seen`) appears ~1.3s after your latest message in Direct Talks only (simulated locally in `stream-view.tsx`).
- **Suggest-as-you-type**: typing in the Shelf filter shows a `drop-suggestions` list of matching people (from your Direct Talks); one tap drops to them (`drop(slug)` now takes an explicit slug).
- Verified by testing_agent iteration_26.json: 100%, all 3 features + regressions pass, no issues.

## Update (2026-06) — Discover public channels from a Door
- Bug: opted-in owners had no way to see other places' public channels. Fix: the visitor Door now lists a place's public channels (new `talkService.listPublicChannels(placeAddress)` → kind channel + placeAddress + visibility public). `DoorChannels` in `door-screen.tsx` renders them as links (testids `door-channels`, `door-channel-{slug}`) to the public channel route `/$address/$channel`.
- Seed: added a public "Studio Notes" channel (slug `notes`, place `studio`) so the flow is demonstrable across places. Private channels (Inner Ring) are excluded from the list.
- Verified by testing_agent iteration_25.json: 7/7 flows pass, no issues (discovery from /studio, from landing search as opted-in owner, private excluded, plus regressions).

## Update (2026-06) — Full-width conversation trail
- The trail was capped at `max-w-2xl` centered. Removed the container cap (`trail w-full`) and lifted `.trail-fragment` max-width from 42rem → 100%, so the conversation fills the panel width. Header + composer were already full width.

## Update (2026-06) — Header shows opted-in state + return-to-Talk
- New `OwnerReturnBadge` (in `talk-shell.tsx` header) shows a quiet "Opted in · talk.kodama.page/{you}" chip with your mark whenever a Talk is remembered. Clicking it returns to your Shelf. Hidden while you're already on your own Talk (`/you` or `/you/...`).
- Solves: after clicking the logo to the landing page, you can get back to the conversation/Shelf you already opted in to.
- Verified live (hidden on Shelf → visible on landing after logo → tap returns to `/alex`) + 158/158 unit tests.

## Update (2026-06) — Fix: Send did nothing with identity menu open
- Root cause: the send identity dropdown's full-screen click-away overlay (`fixed inset-0 z-10`) sat above the Send buttons in the same stacking context, so clicking Send (or the composer) just closed the menu and sent nothing — the "dropping a new message not working" report.
- Fix: raised the Send + chevron buttons to `z-30` above the overlay (`drop-composer.tsx`). Also added error toasts in `StreamView.send` and shelf `drop()` so any real failure surfaces instead of failing silently.
- Verified: primary Send with menu open, normal Send, and "Send anonymously" all post in a brand-new conversation; 158/158 unit tests.

## Update (2026-06) — Trail message contrast (dark mode)
- Own vs others' fragments were near-identical on the dark background. Strengthened `.trail-fragment--out` (green tint + solid `--primary` left bar) and `.trail-fragment--in` (neutral `--muted` raised card), with `.dark` overrides bumping opacity. Clear distinction now in both themes (CSS only, `talk.css`).

## Update (2026-06) — Send identity, Drop→conversation, address in header
- **Send identity options**: the conversation composer's Send is now a split button. Primary = Send from your place (talk.kodama.page/you); a chevron menu adds "Send as {display name}" and "Send anonymously". `DropComposer` gained `identityOptions`/`senderAddress`/`senderName`; `onSend` passes a `DropOrigin`. `sendMessage`/`Message` carry `origin` + `fromLabel`; a fragment shows "You · anonymously" / "You · as {name}". Enabled in `StreamView` (uses `useOwner()` for identity).
- **Drop opens a conversation, not a Drop pane**: the search-bar Drop now opens the person's Direct Talk via new `talkService.getOrCreateDirect(owner, toAddress)` — existing one if present, else a fresh empty Direct Talk that persists in the stream. Removed the old `ComposeDrop` pane.
- **Counterparty address in header**: Direct Talk header shows `talk.kodama.page/{address}` under the name (via `directAddress()`), matching groups/channels. (Header only, per choice.)
- Verified live (identity menu + anonymous fragment, drop→existing Mara, drop→new nadia, header addresses) + 158/158 unit tests.

## Update (2026-06) — One thread per person (merge Drops + Direct Talk)
- Everything with the same person now collapses into a single stream row and one combined trail. `MockTalkService.mergeThreads(a)` (run idempotently at the top of `getShelf`) folds non-anonymous incoming Drops and place-origin sent Drops into that person's Direct Talk — deduped by body — ordered by time, then removes the redundant standalone Drop rows.
- Matching: by Talk address when known, else by name (so a named "Devon" Drop merges with the "Devon" Talk). Creates a Direct Talk on the fly for a person who doesn't have one yet (`bornFromDrop`).
- Left separate by design: Groups, Channels, and truly Anonymous Drops (incoming and sent) — no identity to merge on.
- Verified live (Mara's 4 items → 1 row whose trail holds the Drop + sent + Talk messages, no dupes) + 158/158 unit tests.

## Update (2026-06) — Unread Nudge (reply that came back)
- Direct Talks that grew out of a Drop now carry a `bornFromDrop` flag (`Conversation` type; set in `continueSentDrop` and `replyToDrop`; seeded on `conv-devon`).
- Shelf shows a gentle jade nudge pill above the stream when such a Talk has unread replies: "{name} replied to your Drop" (or "{n} replies came back from your Drops"). Tapping opens the newest one; it clears immediately via a session `seenReplies` set so it never lingers after you've looked. Hidden while filtering. Testid `reply-nudge`.
- Verified live (nudge shows on load → opens Devon's Talk → clears) + 158/158 unit tests.

## Update (2026-06) — Reply Continues (sent Drop → Direct Talk)
- A Drop you sent is no longer a read-only dead-end. Opening it shows a "See it continue" action that rolls it into a **Direct Talk**: your original note becomes the first fragment and their reply continues it, seeded in one thread the "Leave a message…" composer can keep going.
- New `TalkService.continueSentDrop(dropId)` (mock: `mock-talk-service.ts`) creates the `direct` conversation on your place, links `drop.conversationId`, marks the Drop `accepted`, and returns it. Once linked, the sent Drop shows "Open the Talk".
- UI: `SentDetail` in `shelf-screen.tsx` (testids `sent-continue`, `sent-open-talk`). Verified live (open sent drop → continue → thread with note + reply + composer).

## Update (2026-06) — Inline Drop compose (no form / no page change)
- "Drop" (rail input + button) no longer routes to the public Door form. It now opens a compose-ready pane in the Shelf's **main panel** (`ComposeDrop` in `shelf-screen.tsx`): recipient place mark + name + the same conversation composer (`DropComposer`, CTA "Drop", images allowed).
- Sending posts `talkService.sendDrop({ origin: "place", fromAddress = you })`, toasts "Left at talk.kodama.page/{addr}", closes the pane, clears the filter, and the new sent Drop lands at the top of the stream. No navigation (URL stays `/{you}`), no modal.
- Mobile: rail hides while composing; a back button returns to the stream. Verified via browser (unlock alex → type "mara" → Drop → write → send).

## Update (2026-06) — Logo → Landing
- Clicking the Kodama logo (header, `talk-shell.tsx`) now reaches the landing address-entry surface even when a Talk is remembered (previously bounced straight back to the Shelf via auto-resume).
- Mechanism: home `Link` carries router `state={{ fresh: true }}`; `talk-surface.tsx` reads it via `useLocation` and skips the last-opened auto-resume for that one visit. A plain page refresh still auto-resumes. Session stays remembered (option a — non-destructive).
- Verified: 158/158 unit tests + browser flow (unlock alex → Shelf `/alex` → logo → `/` landing, shelf-rail gone).

## Backlog / Next (P1)
- Wire real zero-knowledge via `talk-security-adapter` + a `RemoteTalkService` (replace the one boundary).
- Real attachment upload/preview; message search highlighting; archive/expired invite management screens.
- URL-native deep links for individual streams (`/$address/c/$id`) and join links (`/join/$code`).
- Optimistic send + unread realtime once backend lands.
