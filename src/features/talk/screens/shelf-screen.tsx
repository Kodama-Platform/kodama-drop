import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Lock, MessageSquare, Plus, Search, Send, Settings, Share2 } from "lucide-react";
import { toast } from "sonner";

import type { Attachment, Conversation, Drop, OwnerSession, Place } from "@/features/talk/types";
import { TALK } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { normalizeSlug } from "@/lib/slug";
import { talkService } from "@/features/talk/services";
import { DropComposer } from "@/features/talk/components/drop-composer";
import { TalkShell } from "@/features/talk/components/talk-shell";
import { PlaceMark } from "@/features/talk/components/place-mark";
import { StreamView } from "@/features/talk/components/stream-view";
import { ChannelOwnerView } from "@/features/talk/components/channel-owner-view";
import { DropCard, SentDropCard } from "@/features/talk/components/drop-cards";
import { StreamItemRow, type StreamItem } from "@/features/talk/components/stream-item-row";
import { TalkLoading, TalkEmpty } from "@/features/talk/components/states";
import { Markdown } from "@/features/talk/lib/markdown";
import { SentDropState } from "@/features/talk/components/sent-drop-state";
import {
  NewGroupSheet,
  NewChannelSheet,
  InviteSheet,
  SettingsSheet,
  SearchSheet,
} from "@/features/talk/components/sheets";
import { ShareDoorSheet } from "@/features/talk/components/share-door";
import { OwnerProvider, useOwner } from "@/features/talk/store/owner-context";
import { markFor } from "@/features/talk/lib/mark";
import { relativeTime } from "@/features/talk/lib/time";

export function ShelfScreen({ session, onLock }: { session: OwnerSession; onLock: () => void }) {
  return (
    <OwnerProvider session={session} onLock={onLock}>
      <ShelfInner />
    </OwnerProvider>
  );
}

function ShelfInner() {
  const { session, shelf, loading, refresh, lock } = useOwner();
  const [selected, setSelected] = useState<StreamItem | null>(null);
  const [composeTo, setComposeTo] = useState<string | null>(null);
  const [composePlace, setComposePlace] = useState<Place | null | undefined>(undefined);
  const [sheet, setSheet] = useState<null | "group" | "channel" | "settings" | "search" | "share">(null);
  const [inviteConv, setInviteConv] = useState<Conversation | null>(null);
  const [query, setQuery] = useState("");

  // One living stream — every kind of activity, newest first.
  const items = useMemo<StreamItem[]>(() => {
    if (!shelf) return [];
    const convs: StreamItem[] = [...shelf.directTalks, ...shelf.groups, ...shelf.channels].map((c) => ({
      type: "conversation",
      at: c.lastMessageAt,
      conv: c,
    }));
    const drops: StreamItem[] = shelf.incoming
      .filter((d) => d.status === "delivered")
      .map((d) => ({ type: "drop", at: d.createdAt, drop: d }));
    const sent: StreamItem[] = shelf.sent.map((d) => ({ type: "sent", at: d.createdAt, drop: d }));
    return [...convs, ...drops, ...sent].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  }, [shelf]);

  // The rail input doubles as a filter: narrow the stream as you type.
  const q = query.trim().toLowerCase();
  const filtered = useMemo<StreamItem[]>(() => {
    if (!q) return items;
    return items.filter((it) => {
      if (it.type === "conversation") {
        return it.conv.title.toLowerCase().includes(q)
          || (it.conv.members ?? []).some((m) => (m.label ?? "").toLowerCase().includes(q) || (m.address ?? "").toLowerCase().includes(q));
      }
      if (it.type === "sent") return it.drop.toAddress.toLowerCase().includes(q);
      const name = it.drop.origin === "anonymous" ? "anonymous" : it.drop.fromLabel.toLowerCase();
      return name.includes(q) || (it.drop.fromAddress ?? "").toLowerCase().includes(q);
    });
  }, [items, q]);

  const dropSlug = normalizeSlug(query.trim());
  // "Drop" opens a compose-ready pane in the main panel — no page change, no form.
  const drop = () => {
    if (!dropSlug) return;
    setSelected(null);
    setComposeTo(dropSlug);
  };

  // Resolve the recipient's place for the compose pane (name + mark).
  useEffect(() => {
    if (!composeTo) { setComposePlace(undefined); return; }
    let alive = true;
    setComposePlace(undefined);
    void talkService.resolvePlace(composeTo).then((p) => alive && setComposePlace(p ?? null));
    return () => { alive = false; };
  }, [composeTo]);

  const afterChange = async () => { await refresh(); };
  const openConv = (c: Conversation) => { setComposeTo(null); setSelected({ type: "conversation", at: c.lastMessageAt, conv: c }); };
  const openItem = (it: StreamItem) => { setComposeTo(null); setSelected(it); };

  const isActive = (it: StreamItem) => {
    if (!selected || selected.type !== it.type) return false;
    if (it.type === "conversation") return selected.type === "conversation" && selected.conv.id === it.conv.id;
    return selected.type !== "conversation" && it.type !== "conversation" && selected.drop.id === it.drop.id;
  };

  return (
    <TalkShell
      fillViewport
      headerAction={
        <div className="flex items-center gap-2">
          <button type="button" className="talk-pill !py-2 text-sm" onClick={() => setSheet("share")} data-testid="open-share"><Share2 className="h-4 w-4" /> Share</button>
          <button type="button" className="talk-pill !px-2.5 !py-2" onClick={() => setSheet("search")} aria-label="Search" data-testid="open-search"><Search className="h-4 w-4" /></button>
          <button type="button" className="talk-pill !px-2.5 !py-2" onClick={() => setSheet("settings")} aria-label="Settings" data-testid="open-settings"><Settings className="h-4 w-4" /></button>
          <button type="button" className="talk-pill !px-2.5 !py-2 hover:!border-ember/40 hover:!text-ember" onClick={lock} aria-label="Lock" data-testid="lock-shelf"><Lock className="h-4 w-4" /></button>
        </div>
      }
    >
      <div className="talk-enter mx-auto flex min-h-0 w-full max-w-6xl flex-1 gap-0 px-0 sm:px-4">
        {/* Left shelf rail — the living stream */}
        <aside className={cn("relative z-10 flex w-full max-w-full shrink-0 flex-col border-r border-border/50 sm:w-[19rem] lg:w-[21rem]", (selected || composeTo) && "hidden sm:flex")} data-testid="shelf-rail">
          <div className="flex items-center gap-3 px-4 pb-3 pt-4">
            <PlaceMark mark={markFor(session.displayName, session.address)} size={44} />
            <div className="min-w-0">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-clay">Your place</p>
              <p className="talk-display truncate text-lg leading-tight text-foreground">{session.displayName}</p>
              <p className="truncate font-mono text-[0.7rem] text-primary">{TALK.domain}/{session.address}</p>
            </div>
          </div>

          {/* Filter the stream, or drop a message to any address */}
          <div className="px-4 pb-2">
            <div className="talk-plaque flex items-center gap-2 !py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/55" strokeWidth={1.75} aria-hidden="true" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                placeholder="Filter, or drop to…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && drop()}
                spellCheck={false}
                autoComplete="off"
                data-testid="shelf-filter-input"
              />
              <button
                type="button"
                className="btn-moss shrink-0 !px-2.5 !py-1.5 disabled:opacity-40"
                onClick={drop}
                disabled={!dropSlug}
                aria-label="Drop a message"
                title="Drop a message"
                data-testid="shelf-drop-btn"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </div>
            {q && filtered.length === 0 && (
              <p className="mt-1.5 px-1 text-[0.7rem] font-light text-muted-foreground" data-testid="shelf-filter-empty">
                No matches — press Drop to reach {TALK.domain}/{dropSlug}
              </p>
            )}
          </div>

          {/* Quiet secondary actions — start something new */}
          <div className="flex items-center gap-4 px-4 pb-2 text-[0.8rem]" data-testid="shelf-actions">
            <button type="button" className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground" onClick={() => setSheet("group")} data-testid="new-group">
              <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Group
            </button>
            <button type="button" className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground" onClick={() => setSheet("channel")} data-testid="new-channel">
              <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Channel
            </button>
          </div>
          <div className="mx-4 mb-1 h-px bg-border/50" />

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6" data-testid="shelf-stream">
            {loading ? (
              <TalkLoading label="Opening your shelf…" />
            ) : filtered.length === 0 && !q ? (
              <TalkEmpty
                title="Your place is quiet"
                body="When someone leaves you a Drop — or you start a group or channel — it appears here, newest first."
                action={
                  <button type="button" className="btn-moss" onClick={() => setSheet("share")} data-testid="empty-share-door">
                    <Share2 className="h-4 w-4" /> Share your door
                  </button>
                }
              />
            ) : (
              <div className="space-y-0.5 py-1">
                {filtered.map((it) => (
                  <StreamItemRow
                    key={it.type === "conversation" ? `c-${it.conv.id}` : `${it.type}-${it.drop.id}`}
                    item={it}
                    active={isActive(it)}
                    onOpen={() => openItem(it)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main panel */}
        <section className={cn("min-h-0 flex-1", !selected && !composeTo && "hidden sm:block")} data-testid="shelf-main">
          {composeTo ? (
            <ComposeDrop
              toAddress={composeTo}
              place={composePlace}
              fromAddress={session.address}
              onBack={() => setComposeTo(null)}
              onSent={async () => { await afterChange(); setComposeTo(null); setQuery(""); }}
            />
          ) : selected?.type === "conversation" ? (
            selected.conv.kind === "channel" ? (
              <ChannelOwnerView conversation={selected.conv} onBack={() => setSelected(null)} onChanged={afterChange} onInvite={(c) => setInviteConv(c)} onOpenConversation={(c) => { void afterChange(); openConv(c); }} />
            ) : (
              <StreamView conversation={selected.conv} onBack={() => setSelected(null)} onChanged={afterChange} onInvite={(c) => setInviteConv(c)} />
            )
          ) : selected?.type === "drop" ? (
            <DropDetail
              drop={selected.drop}
              onBack={() => setSelected(null)}
              onOpenConversation={(c) => { void afterChange(); openConv(c); }}
              onResolved={() => { void afterChange(); setSelected(null); }}
            />
          ) : selected?.type === "sent" ? (
            <SentDetail
              drop={selected.drop}
              onBack={() => setSelected(null)}
              onOpenConversation={(c) => { void afterChange(); openConv(c); }}
            />
          ) : (
            <div className="pointer-events-none flex h-full items-center justify-center p-6">
              <TalkEmpty
                title="This is your place"
                body="Everything that happens lives in one stream on the left — Drops from people reaching you, your Direct Talks, groups and channels — newest first. Pick one to open it here."
              />
            </div>
          )}
        </section>
      </div>

      <NewGroupSheet open={sheet === "group"} onOpenChange={(o) => !o && setSheet(null)} address={session.address} onCreated={(c) => { void afterChange(); openConv(c); }} />
      <NewChannelSheet open={sheet === "channel"} onOpenChange={(o) => !o && setSheet(null)} address={session.address} onCreated={(c) => { void afterChange(); openConv(c); }} />
      <SettingsSheet open={sheet === "settings"} onOpenChange={(o) => !o && setSheet(null)} />
      <SearchSheet open={sheet === "search"} onOpenChange={(o) => !o && setSheet(null)} address={session.address} onOpen={openConv} />
      <InviteSheet open={!!inviteConv} onOpenChange={(o) => !o && setInviteConv(null)} conversation={inviteConv} />
      <ShareDoorSheet open={sheet === "share"} onOpenChange={(o) => !o && setSheet(null)} address={session.address} />
    </TalkShell>
  );
}

/** An incoming Drop opened in the main panel — read it, then decide. */
function DropDetail({ drop, onBack, onOpenConversation, onResolved }: {
  drop: Drop;
  onBack: () => void;
  onOpenConversation: (c: Conversation) => void;
  onResolved: (status: Drop["status"]) => void;
}) {
  return (
    <div className="flex h-full flex-col" data-testid="drop-detail">
      <DetailHeader onBack={onBack} label="A Drop" title={drop.origin === "anonymous" ? "Anonymous" : drop.fromLabel} />
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-xl">
          <DropCard drop={drop} onOpen={onOpenConversation} onResolved={onResolved} />
        </div>
      </div>
    </div>
  );
}

/** A Drop you sent to someone else's door. Once they reply it rolls into a Direct Talk. */
function SentDetail({ drop, onBack, onOpenConversation }: {
  drop: Drop;
  onBack: () => void;
  onOpenConversation: (c: Conversation) => void;
}) {
  const [busy, setBusy] = useState(false);
  const fn = firstName(drop.toAddress);

  const openTalk = async () => {
    setBusy(true);
    try {
      const conv = await talkService.continueSentDrop(drop.id);
      onOpenConversation(conv);
    } catch {
      toast.error("Couldn't open the Talk");
    } finally {
      setBusy(false);
    }
  };

  const linked = !!drop.conversationId || drop.status === "accepted";

  return (
    <div className="flex h-full flex-col" data-testid="sent-detail">
      <DetailHeader onBack={onBack} label="You left this" title={`${TALK.domain}/${drop.toAddress}`} />
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-xl">
          <div className="talk-surface p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <PlaceMark mark={markFor(drop.toAddress, drop.toAddress)} size={40} />
                <div>
                  <p className="text-sm text-foreground">to {TALK.domain}/{drop.toAddress}</p>
                  <p className="font-mono text-[0.62rem] uppercase tracking-wider text-muted-foreground/70">
                    {drop.origin === "place" ? `from ${TALK.domain}/${drop.fromAddress}` : drop.origin === "anonymous" ? "sent anonymously" : "sent as guest"} · {relativeTime(drop.createdAt)}
                  </p>
                </div>
              </div>
              <SentDropState status={drop.status} />
            </div>
            {drop.subject && <p className="mt-4 talk-display text-lg text-foreground">{drop.subject}</p>}
            <Markdown text={drop.body} className="md mt-2 break-words text-sm font-light leading-relaxed text-foreground/90" />
          </div>

          {/* The note keeps going — a reply rolls this Drop into a Direct Talk. */}
          <div className="mt-4 flex flex-col items-center gap-2 text-center" data-testid="sent-continue">
            <p className="max-w-sm text-sm font-light leading-relaxed text-muted-foreground">
              {linked
                ? `${fn} replied — your note is now a Direct Talk.`
                : `When ${fn} replies, your note keeps going here as a Direct Talk.`}
            </p>
            <button
              type="button"
              className="btn-moss justify-center disabled:opacity-50"
              onClick={openTalk}
              disabled={busy}
              data-testid="sent-open-talk"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
              {linked ? "Open the Talk" : "See it continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailHeader({ onBack, label, title }: { onBack: () => void; label: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-border/50 px-4 py-3">
      <button type="button" className="talk-pill !px-2.5 !py-2 sm:hidden" onClick={onBack} aria-label="Back" data-testid="detail-back">
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div className="min-w-0">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-clay">{label}</p>
        <p className="talk-display truncate text-lg leading-tight text-foreground">{title}</p>
      </div>
    </div>
  );
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

/** Compose a Drop to any address, inline in the main panel — no form, no page change. */
function ComposeDrop({ toAddress, place, fromAddress, onBack, onSent }: {
  toAddress: string;
  place: Place | null | undefined;
  fromAddress: string;
  onBack: () => void;
  onSent: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const name = place ? place.displayName : toAddress;
  const fn = firstName(name);

  const send = async (body: string, keepsakes?: Attachment[]) => {
    if (!body.trim() && !(keepsakes && keepsakes.length)) return;
    setBusy(true);
    try {
      await talkService.sendDrop({
        toAddress,
        origin: "place",
        fromLabel: fromAddress,
        fromAddress,
        body: body.trim(),
        attachments: keepsakes,
      });
      toast.success(`Left at ${TALK.domain}/${toAddress}`);
      await onSent();
    } catch {
      toast.error("Could not leave your Drop");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col" data-testid="compose-drop">
      <div className="flex items-center gap-2.5 border-b border-border/50 px-4 py-3">
        <button type="button" className="talk-pill !px-2.5 !py-2 sm:hidden" onClick={onBack} aria-label="Back" data-testid="compose-back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PlaceMark mark={place ? place.mark : markFor(toAddress, toAddress)} size={40} />
        <div className="min-w-0">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-clay">Leaving a Drop</p>
          <p className="talk-display truncate text-lg leading-tight text-foreground" data-testid="compose-recipient">{name}</p>
          <p className="truncate font-mono text-[0.7rem] text-primary">{TALK.domain}/{toAddress}</p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-xl">
          {place === undefined ? (
            <TalkLoading label="Finding their door…" />
          ) : (
            <>
              <p className="mb-3 text-sm font-light leading-relaxed text-muted-foreground">
                {place === null ? (
                  <>This address isn&apos;t claimed yet — your note waits at the door.</>
                ) : (
                  <>Leave <span className="text-foreground">{fn}</span> a note — they&apos;ll find it at their door.</>
                )}{" "}
                Signed from <span className="text-foreground">{TALK.domain}/{fromAddress}</span>.
              </p>
              <DropComposer
                placeholder={`Write to ${fn}…`}
                cta="Drop"
                busy={busy}
                allowImages
                onSend={(body, _label, keepsakes) => void send(body, keepsakes)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
