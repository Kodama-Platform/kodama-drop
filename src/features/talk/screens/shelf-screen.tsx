import { useMemo, useState } from "react";
import {
  Archive,
  Hash,
  Inbox,
  MessageCircle,
  Pin,
  Plus,
  Search,
  Send,
  Settings,
  Share2,
  Lock,
  Users,
} from "lucide-react";

import type { Conversation, OwnerSession } from "@/features/talk/types";
import { TALK } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { TalkShell } from "@/features/talk/components/talk-shell";
import { PlaceMark } from "@/features/talk/components/place-mark";
import { ConversationRow } from "@/features/talk/components/conversation-row";
import { StreamView } from "@/features/talk/components/stream-view";
import { DropCard, SentDropCard } from "@/features/talk/components/drop-cards";
import { ShelfSection } from "@/features/talk/components/shelf-section";
import { TalkLoading, TalkEmpty } from "@/features/talk/components/states";
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

type Section = "drops" | "sent" | "direct" | "groups" | "channels" | "pinned";

export function ShelfScreen({ session, onLock }: { session: OwnerSession; onLock: () => void }) {
  return (
    <OwnerProvider session={session} onLock={onLock}>
      <ShelfInner />
    </OwnerProvider>
  );
}

function ShelfInner() {
  const { session, shelf, loading, refresh, lock } = useOwner();
  const [section, setSection] = useState<Section>("drops");
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [sheet, setSheet] = useState<null | "group" | "channel" | "settings" | "search" | "share">(null);
  const [inviteConv, setInviteConv] = useState<Conversation | null>(null);

  const nav = useMemo(
    () => [
      { key: "drops" as const, label: "Drops", icon: Inbox, count: shelf?.incoming.length ?? 0 },
      { key: "direct" as const, label: "Talks", icon: MessageCircle, count: shelf?.directTalks.length ?? 0 },
      { key: "groups" as const, label: "Groups", icon: Users, count: shelf?.groups.length ?? 0 },
      { key: "channels" as const, label: "Channels", icon: Hash, count: shelf?.channels.length ?? 0 },
      { key: "pinned" as const, label: "Pinned", icon: Pin, count: shelf?.pinned.length ?? 0 },
      { key: "sent" as const, label: "Sent", icon: Send, count: shelf?.sent.length ?? 0 },
    ],
    [shelf],
  );

  const open = (c: Conversation) => setSelected(c);
  const afterChange = async () => {
    await refresh();
  };

  const listFor = (): Conversation[] => {
    if (!shelf) return [];
    switch (section) {
      case "direct": return shelf.directTalks;
      case "groups": return shelf.groups;
      case "channels": return shelf.channels;
      case "pinned": return shelf.pinned;
      default: return [];
    }
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
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 gap-0 px-0 sm:px-4">
        {/* Left shelf rail */}
        <aside className={cn("flex w-full max-w-full shrink-0 flex-col border-r border-border/50 sm:w-[19rem] lg:w-[21rem]", selected && "hidden sm:flex")} data-testid="shelf-rail">
          <div className="flex items-center gap-3 px-4 pb-3 pt-4">
            <PlaceMark mark={markFor(session.displayName, session.address)} size={44} />
            <div className="min-w-0">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-clay">Your place</p>
              <p className="talk-display truncate text-lg leading-tight text-foreground">{session.displayName}</p>
              <p className="truncate font-mono text-[0.7rem] text-primary">{TALK.domain}/{session.address}</p>
            </div>
          </div>

          <p className="px-4 pb-2 text-xs font-light italic text-muted-foreground/70" data-testid="shelf-purpose">
            Decide what becomes a conversation.
          </p>

          <nav className="flex gap-4 overflow-x-auto px-4 pb-1" data-testid="shelf-nav">
            {nav.map((n) => {
              const active = section === n.key;
              const showFirefly = n.key === "drops" && n.count > 0;
              return (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => { setSection(n.key); setSelected(null); }}
                  className={cn(
                    "group relative shrink-0 pb-2 text-sm transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                  data-testid={`nav-${n.key}`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {n.label}
                    {showFirefly && <span className="h-1.5 w-1.5 rounded-full bg-ember shadow-[0_0_8px_1px_rgb(var(--ember)/0.5)]" data-testid="drops-firefly" />}
                  </span>
                  <span
                    className={cn(
                      "absolute inset-x-0 -bottom-px h-px origin-left rounded-full bg-primary transition-transform duration-300",
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50",
                    )}
                  />
                </button>
              );
            })}
          </nav>
          <div className="mx-4 mb-2 h-px bg-border/50" />

          {(section === "groups" || section === "channels") && (
            <div className="px-4 pb-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-sm text-primary transition-colors hover:text-foreground"
                onClick={() => setSheet(section === "groups" ? "group" : "channel")}
                data-testid={section === "groups" ? "new-group" : "new-channel"}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                {section === "groups" ? "New group" : "New channel"}
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
            {loading ? (
              <TalkLoading label="Opening your shelf…" />
            ) : section === "drops" ? (
              <DropsPane onOpen={open} onResolved={afterChange} onShare={() => setSheet("share")} />
            ) : section === "sent" ? (
              <SentPane />
            ) : (
              <ConversationPane list={listFor()} section={section} selected={selected} onOpen={open} />
            )}
          </div>
        </aside>

        {/* Main stream */}
        <section className={cn("min-h-0 flex-1", !selected && "hidden sm:block")} data-testid="shelf-main">
          {selected ? (
            <StreamView conversation={selected} onBack={() => setSelected(null)} onChanged={afterChange} onInvite={(c) => setInviteConv(c)} />
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <TalkEmpty
                title="This is your place"
                body="On the left: Drops from people reaching you, Talks (a reply turns a Drop into a private Direct Talk), and any Groups or Channels you start. Pick one to open it here."
              />
            </div>
          )}
        </section>
      </div>

      <NewGroupSheet open={sheet === "group"} onOpenChange={(o) => !o && setSheet(null)} address={session.address} onCreated={(c) => { void afterChange(); open(c); }} />
      <NewChannelSheet open={sheet === "channel"} onOpenChange={(o) => !o && setSheet(null)} address={session.address} onCreated={(c) => { void afterChange(); open(c); }} />
      <SettingsSheet open={sheet === "settings"} onOpenChange={(o) => !o && setSheet(null)} />
      <SearchSheet open={sheet === "search"} onOpenChange={(o) => !o && setSheet(null)} address={session.address} onOpen={open} />
      <InviteSheet open={!!inviteConv} onOpenChange={(o) => !o && setInviteConv(null)} conversation={inviteConv} />
      <ShareDoorSheet open={sheet === "share"} onOpenChange={(o) => !o && setSheet(null)} address={session.address} />
    </TalkShell>
  );
}

function DropsPane({ onOpen, onResolved, onShare }: { onOpen: (c: Conversation) => void; onResolved: () => void; onShare: () => void }) {
  const { shelf } = useOwner();
  if (!shelf) return null;
  if (shelf.incoming.length === 0)
    return (
      <TalkEmpty
        title="No new Drops yet"
        body="When someone reaches you, their Drop settles here. Share your address to receive your first."
        action={
          <button type="button" className="btn-moss" onClick={onShare} data-testid="empty-share-door">
            <Share2 className="h-4 w-4" /> Share your door
          </button>
        }
      />
    );
  return (
    <ShelfSection label="Incoming Drops" count={shelf.incoming.length} className="p-1">
      <div className="space-y-2.5">
        {shelf.incoming.map((d) => (
          <DropCard key={d.id} drop={d} onOpen={(c) => { onResolved(); onOpen(c); }} />
        ))}
      </div>
    </ShelfSection>
  );
}

function SentPane() {
  const { shelf } = useOwner();
  if (!shelf) return null;
  if (shelf.sent.length === 0) return <TalkEmpty title="Nothing sent yet" body="Drops you send to other places appear here — clearly marked anonymous or from your address." />;
  return (
    <ShelfSection label="Sent Drops" count={shelf.sent.length} className="p-1">
      <div className="space-y-2.5">
        {shelf.sent.map((d) => <SentDropCard key={d.id} drop={d} />)}
      </div>
    </ShelfSection>
  );
}

function ConversationPane({ list, section, selected, onOpen }: { list: Conversation[]; section: Section; selected: Conversation | null; onOpen: (c: Conversation) => void }) {
  if (list.length === 0) {
    const copy: Record<string, [string, string]> = {
      direct: ["No Direct Talks yet", "Reply to a Drop and it becomes a private Direct Talk."],
      groups: ["No groups yet", "Create a private, invite-only group to gather people."],
      channels: ["No channels yet", "Create a channel to share updates or open a discussion."],
      pinned: ["Nothing pinned", "Pin the places you keep close — they'll wait for you here."],
    };
    const [t, b] = copy[section] ?? ["Empty", ""];
    return <div className="flex items-center gap-2 p-2"><Archive className="h-4 w-4 text-muted-foreground" /><TalkEmpty title={t} body={b} /></div>;
  }
  return (
    <div className="space-y-0.5 py-1">
      {list.map((c) => (
        <ConversationRow key={c.id} conversation={c} active={selected?.id === c.id} onOpen={() => onOpen(c)} />
      ))}
    </div>
  );
}
