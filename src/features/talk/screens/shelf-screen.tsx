import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CornerDownLeft, Loader2, Lock, MessageSquare, Plus, Search, Send, Settings, Share2 } from "lucide-react";
import { toast } from "sonner";

import type { Conversation, Drop, OwnerSession } from "@/features/talk/types";
import { TALK } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { normalizeSlug } from "@/lib/slug";
import { talkService } from "@/features/talk/services";
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
  const navigate = useNavigate();
  const [selected, setSelected] = useState<StreamItem | null>(null);
  const [seenReplies, setSeenReplies] = useState<Set<string>>(() => new Set());
  const [followed, setFollowed] = useState<Conversation[]>([]);
  const [sheet, setSheet] = useState<null | "group" | "channel" | "settings" | "search" | "share">(null);
  const [inviteConv, setInviteConv] = useState<Conversation | null>(null);
  const [query, setQuery] = useState("");

  // Public channels you follow on OTHER places — surfaced here so you can jump
  // back without retyping the address.
  useEffect(() => {
    let alive = true;
    void talkService.listFollowedChannels().then((cs) => {
      if (alive) setFollowed(cs.filter((c) => c.placeAddress !== session.address));
    });
    return () => { alive = false; };
  }, [session.address, shelf]);

  const channelSlugOf = (c: Conversation) => c.channelSlug ?? normalizeSlug(c.title);
  const openPublicChannel = (c: Conversation) =>
    void navigate({ to: "/$address/$channel", params: { address: c.placeAddress, channel: channelSlugOf(c) }, search: { invite: undefined } });

  // One living stream — every kind of activity, newest first.
  const items = useMemo<StreamItem[]>(() => {
    if (!shelf) return [];
    const seen = new Set<string>();
    const convs: StreamItem[] = [...shelf.directTalks, ...shelf.groups, ...shelf.channels, ...followed]
      .filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)))
      .map((c) => ({ type: "conversation", at: c.lastMessageAt, conv: c }));
    const drops: StreamItem[] = shelf.incoming
      .filter((d) => d.status === "delivered")
      .map((d) => ({ type: "drop", at: d.createdAt, drop: d }));
    const sent: StreamItem[] = shelf.sent.map((d) => ({ type: "sent", at: d.createdAt, drop: d }));
    return [...convs, ...drops, ...sent].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  }, [shelf, followed]);

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
  // "Drop" opens the person's Direct Talk — the existing one, or a fresh one.
  const drop = async (slug: string = dropSlug) => {
    if (!slug) return;
    try {
      const conv = await talkService.getOrCreateDirect(session.address, slug);
      await refresh();
      setQuery("");
      openConv(conv);
    } catch (err) {
      console.error("getOrCreateDirect failed", err);
      toast.error("Couldn't open that conversation — please try again.");
    }
  };

  const afterChange = async () => { await refresh(); };
  const markReplySeen = (c: Conversation) => {
    if (c.bornFromDrop) setSeenReplies((s) => (s.has(c.id) ? s : new Set(s).add(c.id)));
  };
  const openConv = (c: Conversation) => { markReplySeen(c); setSelected({ type: "conversation", at: c.lastMessageAt, conv: c }); };
  const openItem = (it: StreamItem) => {
    // A followed channel on another place opens its public page — you're a visitor there.
    if (it.type === "conversation" && it.conv.kind === "channel" && it.conv.placeAddress !== session.address) {
      openPublicChannel(it.conv);
      return;
    }
    if (it.type === "conversation") markReplySeen(it.conv);
    setSelected(it);
  };

  // Suggest matching people as you type — one tap to drop to them.
  const people = useMemo(() => {
    if (!shelf) return [] as { address?: string; label: string; mark: Conversation["mark"] }[];
    const seen = new Set<string>();
    const list: { address?: string; label: string; mark: Conversation["mark"] }[] = [];
    for (const c of shelf.directTalks) {
      const other = (c.members ?? []).find((m) => m.role !== "owner");
      const address = other?.address;
      const label = other?.label ?? c.title;
      const key = (address ?? label).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ address, label, mark: c.mark });
    }
    return list;
  }, [shelf]);

  const suggestions = useMemo(() => {
    if (!q) return [];
    return people
      .filter((p) => p.label.toLowerCase().includes(q) || (p.address ?? "").toLowerCase().includes(q))
      .slice(0, 4);
  }, [people, q]);

  // Gentle nudge: replies that came back from your Drops, newest first — so none slip past.
  const replies = useMemo(
    () =>
      items
        .filter((it): it is Extract<StreamItem, { type: "conversation" }> =>
          it.type === "conversation" && !!it.conv.bornFromDrop && it.conv.unreadCount > 0 && !seenReplies.has(it.conv.id))
        .map((it) => it.conv),
    [items, seenReplies],
  );

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
        <aside className={cn("relative z-10 flex w-full max-w-full shrink-0 flex-col border-r border-border/50 sm:w-[19rem] lg:w-[21rem]", selected && "hidden sm:flex")} data-testid="shelf-rail">
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
                onClick={() => void drop()}
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
            {suggestions.length > 0 && (
              <div className="mt-1.5 overflow-hidden rounded-xl border border-border/60 bg-card/70 py-1 backdrop-blur" data-testid="drop-suggestions">
                {suggestions.map((p) => (
                  <button
                    key={(p.address ?? p.label).toLowerCase()}
                    type="button"
                    className="flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left transition-colors hover:bg-primary/8"
                    onClick={() => void drop(p.address ?? normalizeSlug(p.label))}
                    data-testid={`drop-suggestion-${(p.address ?? normalizeSlug(p.label))}`}
                  >
                    <PlaceMark mark={p.mark} size={26} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">{p.label}</span>
                      {p.address && <span className="block truncate font-mono text-[0.62rem] text-muted-foreground/70">{TALK.domain}/{p.address}</span>}
                    </span>
                    <Send className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                ))}
              </div>
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

          {/* Unread nudge — a reply came back from a Drop you left; don't let it slip past. */}
          {!q && replies.length > 0 && (
            <button
              type="button"
              className="mx-3 mb-1.5 flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/8 px-3 py-2 text-left transition-colors hover:border-primary/45 hover:bg-primary/12"
              onClick={() => openConv(replies[0])}
              data-testid="reply-nudge"
            >
              <span className="talk-firefly-dot shrink-0" aria-hidden="true" />
              <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[0.8rem] font-light text-foreground">
                {replies.length === 1
                  ? <><span className="text-primary">{replies[0].title}</span> replied to your Drop</>
                  : <><span className="text-primary">{replies.length} replies</span> came back from your Drops</>}
              </span>
            </button>
          )}

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
        <section className={cn("min-h-0 flex-1", !selected && "hidden sm:block")} data-testid="shelf-main">
          {selected?.type === "conversation" ? (
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
  // Only Drops sent from your place carry an identity — those alone can roll into a Talk.
  const canContinue = drop.origin === "place" && !!drop.fromAddress;

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
                    from {TALK.domain}/{drop.fromAddress} · {relativeTime(drop.createdAt)}
                  </p>
                </div>
              </div>
              <SentDropState status={drop.status} />
            </div>
            {drop.subject && <p className="mt-4 talk-display text-lg text-foreground">{drop.subject}</p>}
            <Markdown text={drop.body} className="md mt-2 break-words text-sm font-light leading-relaxed text-foreground/90" />
          </div>

          {/* The note keeps going — a reply rolls this Drop into a Direct Talk. */}
          {canContinue && (
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
          )}
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
