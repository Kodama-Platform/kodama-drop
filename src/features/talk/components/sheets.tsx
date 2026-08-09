import { useEffect, useState } from "react";
import { Check, Copy, Hash, Loader2, LogOut, Search as SearchIcon, Users } from "lucide-react";
import { toast } from "sonner";

import { talkService } from "@/features/talk/services";
import { TALK } from "@/lib/brand";
import type {
  ChannelReplyPolicy,
  ChannelVisibility,
  Conversation,
  Drop,
  NotificationPrefs,
} from "@/features/talk/types";
import { TalkSheet } from "@/features/talk/components/talk-sheet";
import { useOwner } from "@/features/talk/store/owner-context";
import { copyText } from "@/features/talk/lib/clipboard";

const field = "note-input";

export function NewGroupSheet({ open, onOpenChange, address, onCreated }: SheetBase & { address: string; onCreated: (c: Conversation) => void }) {
  const [title, setTitle] = useState("");
  const [members, setMembers] = useState("");
  const [busy, setBusy] = useState(false);
  const create = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const c = await talkService.createGroup({ placeAddress: address, title: title.trim(), memberLabels: members.split(",").map((s) => s.trim()).filter(Boolean) });
      toast.success("Private group created");
      onCreated(c);
      onOpenChange(false);
      setTitle(""); setMembers("");
    } finally { setBusy(false); }
  };
  return (
    <TalkSheet open={open} onOpenChange={onOpenChange} title="New group" description="Private and invite-only. Never discoverable.">
      <div className="space-y-4">
        <Labeled label="Group name"><input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Design Team" data-testid="group-name-input" autoFocus /></Labeled>
        <Labeled label="Invite people (comma-separated, optional)"><input className={field} value={members} onChange={(e) => setMembers(e.target.value)} placeholder="Mara, Devon, Wren" data-testid="group-members-input" /></Labeled>
        <button type="button" className="btn-moss w-full justify-center disabled:opacity-50" onClick={create} disabled={busy || !title.trim()} data-testid="group-create-btn">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />} Create group
        </button>
      </div>
    </TalkSheet>
  );
}

export function NewChannelSheet({ open, onOpenChange, address, onCreated }: SheetBase & { address: string; onCreated: (c: Conversation) => void }) {
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<ChannelVisibility>("public");
  const [replyPolicy, setReplyPolicy] = useState<ChannelReplyPolicy>("open");
  const [busy, setBusy] = useState(false);
  const create = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const c = await talkService.createChannel({ placeAddress: address, title: title.trim(), visibility, replyPolicy });
      toast.success("Channel created");
      onCreated(c);
      onOpenChange(false);
      setTitle("");
    } finally { setBusy(false); }
  };
  return (
    <TalkSheet open={open} onOpenChange={onOpenChange} title="New channel" description="A place for updates and discussion.">
      <div className="space-y-4">
        <Labeled label="Channel name"><input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Field Notes" data-testid="channel-name-input" autoFocus /></Labeled>
        <Segmented label="Who can see it" value={visibility} onChange={(v) => setVisibility(v as ChannelVisibility)} options={[["public", "Public"], ["private", "Private · invite-only"]]} testid="channel-visibility" />
        <Segmented label="Replies" value={replyPolicy} onChange={(v) => setReplyPolicy(v as ChannelReplyPolicy)} options={[["open", "Anyone"], ["owner-only", "Owner only"], ["off", "Off"]]} testid="channel-reply" />
        <button type="button" className="btn-moss w-full justify-center disabled:opacity-50" onClick={create} disabled={busy || !title.trim()} data-testid="channel-create-btn">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hash className="h-4 w-4" />} Create channel
        </button>
      </div>
    </TalkSheet>
  );
}

export function InviteSheet({ open, onOpenChange, conversation }: SheetBase & { conversation: Conversation | null }) {
  const [link, setLink] = useState("");
  useEffect(() => {
    if (open && conversation) void talkService.createInvite(conversation.id).then((inv) => setLink(`${TALK.url}/join/${inv.code}`));
  }, [open, conversation]);
  const copy = async () => { if (await copyText(link)) toast.success("Invite link copied"); else toast.error("Couldn't copy"); };
  return (
    <TalkSheet open={open} onOpenChange={onOpenChange} title="Invite link" description="Anyone with this link can join. The invite secret is sealed.">
      <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/50 p-2">
        <span className="flex-1 truncate px-2 font-mono text-sm text-foreground" data-testid="invite-link">{link || "Minting…"}</span>
        <button type="button" className="btn-moss !px-3 !py-2 text-sm" onClick={copy} disabled={!link} data-testid="invite-copy"><Copy className="h-4 w-4" /> Copy</button>
      </div>
    </TalkSheet>
  );
}

export function SettingsSheet({ open, onOpenChange }: SheetBase) {
  const { session, refresh, forget } = useOwner();
  const [displayName, setDisplayName] = useState(session.displayName);
  const [tagline, setTagline] = useState("");
  const [doorNote, setDoorNote] = useState("");
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    if (!open) return;
    void talkService.resolvePlace(session.address).then((p) => { if (p) { setDisplayName(p.displayName); setTagline(p.tagline); setDoorNote(p.doorNote ?? ""); } });
    void talkService.getNotificationPrefs(session.address).then(setPrefs);
  }, [open, session.address]);

  const save = async () => {
    await talkService.updatePlace(session.address, { displayName, tagline, doorNote });
    if (prefs) await talkService.setNotificationPrefs(session.address, prefs);
    toast.success("Settings saved");
    await refresh();
    onOpenChange(false);
  };

  const toggle = (k: keyof NotificationPrefs) => setPrefs((p) => (p ? { ...p, [k]: !p[k] } : p));

  return (
    <TalkSheet open={open} onOpenChange={onOpenChange} title="Owner settings" description={`talk.kodama.page/${session.address}`}>
      <div className="space-y-5">
        <Labeled label="Display name"><input className={field} value={displayName} onChange={(e) => setDisplayName(e.target.value)} data-testid="settings-name" /></Labeled>
        <Labeled label="Tagline"><input className={field} value={tagline} onChange={(e) => setTagline(e.target.value)} data-testid="settings-tagline" /></Labeled>
        <Labeled label="Door note — a gentle line shown to visitors (optional)"><input className={field} value={doorNote} onChange={(e) => setDoorNote(e.target.value)} placeholder="Slow to reply this week — Drops still welcome." data-testid="settings-doornote" /></Labeled>
        <div>
          <p className="talk-section-label mb-2">Notifications</p>
          <div className="space-y-1.5">
            {prefs && ([
              ["incomingDrops", "Incoming Drops"],
              ["directReplies", "Direct replies"],
              ["groupActivity", "Group activity"],
              ["channelPosts", "Channel posts"],
              ["quietHours", "Quiet hours"],
            ] as [keyof NotificationPrefs, string][]).map(([k, label]) => (
              <label key={k} className="flex cursor-pointer items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm">
                <span className="text-foreground/90">{label}</span>
                <input type="checkbox" className="accent-primary" checked={prefs[k]} onChange={() => toggle(k)} data-testid={`pref-${k}`} />
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <button type="button" className="talk-pill hover:!border-destructive/40 hover:!text-destructive" onClick={forget} data-testid="settings-forget"><LogOut className="h-4 w-4" /> Forget this device</button>
          <button type="button" className="btn-moss disabled:opacity-50" onClick={save} data-testid="settings-save"><Check className="h-4 w-4" /> Save</button>
        </div>
      </div>
    </TalkSheet>
  );
}

export function SearchSheet({ open, onOpenChange, address, onOpen }: SheetBase & { address: string; onOpen: (c: Conversation) => void }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<{ conversations: Conversation[]; drops: Drop[] } | null>(null);
  useEffect(() => {
    if (!open) { setQ(""); setRes(null); return; }
  }, [open]);
  useEffect(() => {
    if (!q.trim()) { setRes(null); return; }
    const t = setTimeout(() => void talkService.search(address, q).then((r) => setRes({ conversations: r.conversations, drops: r.drops })), 150);
    return () => clearTimeout(t);
  }, [q, address]);
  return (
    <TalkSheet open={open} onOpenChange={onOpenChange} title="Search" description="Find a conversation, place, or Drop.">
      <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/50 px-3">
        <SearchIcon className="h-4 w-4 text-muted-foreground" />
        <input className="w-full bg-transparent py-2.5 text-sm outline-none" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus data-testid="search-input" />
      </div>
      <div className="mt-4 space-y-1.5">
        {res?.conversations.map((c) => (
          <button key={c.id} type="button" className="talk-row" onClick={() => { onOpen(c); onOpenChange(false); }} data-testid={`search-conv-${c.id}`}>
            <span className="talk-row-body"><span className="talk-row-title">{c.title}</span><span className="talk-row-preview">{c.lastMessagePreview}</span></span>
          </button>
        ))}
        {res && res.conversations.length === 0 && res.drops.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No matches.</p>
        )}
      </div>
    </TalkSheet>
  );
}

/* ── small helpers ── */
type SheetBase = { open: boolean; onOpenChange: (o: boolean) => void };

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[0.66rem] uppercase tracking-[0.14em] text-clay">{label}</span>
      {children}
    </label>
  );
}

function Segmented({ label, value, onChange, options, testid }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][]; testid: string }) {
  return (
    <div>
      <span className="mb-1.5 block font-mono text-[0.66rem] uppercase tracking-[0.14em] text-clay">{label}</span>
      <div className="flex flex-wrap gap-1.5" data-testid={testid}>
        {options.map(([v, l]) => (
          <button key={v} type="button" onClick={() => onChange(v)} className={`talk-pill !py-1.5 text-sm ${value === v ? "!border-primary/50 !bg-primary/10 !text-foreground" : ""}`} data-testid={`${testid}-${v}`}>{l}</button>
        ))}
      </div>
    </div>
  );
}
