import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, EyeOff, KeyRound, Loader2, Lock, MapPin, Radio, Send } from "lucide-react";
import { toast } from "sonner";

import { TALK } from "@/lib/brand";
import { talkService } from "@/features/talk/services";
import type { Conversation, DropOrigin, Message, Place } from "@/features/talk/types";
import { TalkShell } from "@/features/talk/components/talk-shell";
import { PlaceMark } from "@/features/talk/components/place-mark";
import { MessageFragment } from "@/features/talk/components/message-fragment";
import { ReachFooter } from "@/features/talk/components/reach-cta";
import { TalkLoading, TalkError, TalkEmpty } from "@/features/talk/components/states";

const MODE_NOTE: Record<string, string> = {
  reviewed: "Replies are reviewed — the owner sees yours before it appears.",
  open: "Replies appear here for everyone.",
  members: "A members-only channel — replies are shared with the group.",
};

export function ChannelPublicScreen({ placeAddress, slug, invite }: { placeAddress: string; slug: string; invite?: string }) {
  const channelAddress = `${placeAddress}/${slug}`;
  const [place, setPlace] = useState<Place | null | undefined>(undefined);
  const [channel, setChannel] = useState<Conversation | null | undefined>(undefined);
  const [posts, setPosts] = useState<Message[]>([]);
  const [member, setMember] = useState(false);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [p, c] = await Promise.all([
        talkService.resolvePlace(placeAddress),
        talkService.resolveChannel(placeAddress, slug),
      ]);
      if (!alive) return;
      setPlace(p);
      setChannel(c);
      setFollowing(talkService.isFollowing(channelAddress));
      if (c) {
        let m = talkService.isMember(c.id);
        if (!m && invite && talkService.joinChannelByInvite(c.id, invite)) {
          m = true;
          toast.success("You've joined this channel on this device");
        }
        setMember(m);
        setPosts(await talkService.listMessages(c.id));
      }
    })();
    return () => { alive = false; };
  }, [placeAddress, slug, channelAddress, invite]);

  const refresh = async () => { if (channel) setPosts(await talkService.listMessages(channel.id)); };

  const toggleFollow = () => {
    if (following) { talkService.unfollowChannel(channelAddress); setFollowing(false); }
    else { talkService.followChannel(channelAddress); setFollowing(true); toast("Following — saved on this device"); }
  };

  if (channel === undefined || place === undefined) {
    return <TalkShell centered><div className="talk-enter"><TalkLoading label="Opening the channel…" /></div></TalkShell>;
  }
  if (!channel || !place) {
    return (
      <TalkShell centered>
        <TalkError title="No channel here" body={`${TALK.domain}/${channelAddress} doesn't lead anywhere yet.`} action={<Link to="/" className="btn-moss">Back home</Link>} />
      </TalkShell>
    );
  }

  const isPrivate = channel.visibility === "private";
  const gated = isPrivate && !member;
  const VisIcon = isPrivate ? Lock : Radio;

  return (
    <TalkShell centered>
      <div className="talk-enter w-full max-w-2xl px-4" data-testid="channel-view">
        {/* Channel identity */}
        <div className="talk-surface p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <PlaceMark mark={channel.mark} size={52} />
              <div className="min-w-0">
                <h1 className="talk-display truncate text-2xl text-foreground" data-testid="channel-title">{channel.title}</h1>
                <p className="truncate font-mono text-[0.72rem] text-primary" data-testid="channel-address">{TALK.domain}/{channelAddress}</p>
                <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-wider text-muted-foreground/75">
                  <VisIcon className="h-3 w-3" strokeWidth={1.75} /> {isPrivate ? "Private channel" : "Public channel"} · by {place.displayName}
                </p>
              </div>
            </div>
            {!gated && (
              <button type="button" className="talk-pill shrink-0 !py-2 text-sm" data-active={following} onClick={toggleFollow} data-testid="follow-channel">
                {following ? <><Check className="h-3.5 w-3.5" /> Following</> : "Follow"}
              </button>
            )}
          </div>
          <div className="mt-4 border-t border-border/50 pt-3 text-center">
            <Link to="/$address" params={{ address: placeAddress }} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" data-testid="contact-owner">
              Drop {firstName(place.displayName)} a private message
            </Link>
          </div>
        </div>

        {gated ? (
          <div className="talk-surface mt-5 p-7 text-center" data-testid="channel-access-gate">
            <Lock className="mx-auto mb-3 h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="talk-display text-xl text-foreground">Invite required</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm font-light text-muted-foreground">
              This is a private channel. Open a valid invite link to read and reply — your place is saved on this device.
            </p>
          </div>
        ) : (
          <>
            {/* Posts */}
            <div className="mt-6" data-testid="channel-posts">
              {posts.length === 0 ? (
                <TalkEmpty title="Nothing posted yet" body="When the owner shares an update, it appears here." />
              ) : (
                <div className="trail mx-auto w-full">
                  {posts.map((m, i) => {
                    const prev = posts[i - 1];
                    const same = !!prev && prev.authorLabel === m.authorLabel && prev.fromOwner === m.fromOwner;
                    return <MessageFragment key={m.id} message={m} showAuthor={!same} clusterStart={!same && i > 0} />;
                  })}
                </div>
              )}
            </div>

            {/* Reply zone */}
            <div className="mt-5">
              <ChannelReply channel={channel} member={member} onSent={refresh} ownerName={place.displayName} placeAddress={placeAddress} />
            </div>
          </>
        )}
        <ReachFooter />
      </div>
    </TalkShell>
  );
}

function ChannelReply({ channel, member, onSent, ownerName, placeAddress }: {
  channel: Conversation;
  member: boolean;
  onSent: () => void;
  ownerName: string;
  placeAddress: string;
}) {
  const policy = channel.replyPolicy ?? "reviewed";
  const closed = channel.state === "locked" || channel.state === "archived";
  const myTalk = useMemo(() => talkService.lastOpenedTalk(), []);
  const [origin, setOrigin] = useState<DropOrigin>("anonymous");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<null | "pending" | "published">(null);

  if (closed) {
    return <ClosedNote text="Replies are closed on this channel." />;
  }
  if (policy === "read-only") {
    return <ClosedNote text="This channel is read-only — replies are off." />;
  }
  if (policy === "private-contact") {
    return (
      <div className="talk-surface p-6 text-center" data-testid="channel-private-contact">
        <p className="text-sm font-light text-muted-foreground">This channel shares one-way. To respond, message {firstName(ownerName)} privately.</p>
        <Link to="/$address" params={{ address: placeAddress }} className="btn-moss mt-4 inline-flex justify-center" data-testid="channel-drop-owner">
          <Send className="h-4 w-4" /> Drop {firstName(ownerName)} a message
        </Link>
      </div>
    );
  }
  if (policy === "members" && !member) {
    return (
      <ClosedNote text="Members reply here. Open your invite link to join, then you can reply." />
    );
  }

  if (receipt) {
    return (
      <div className="talk-surface p-6 text-center" data-testid="channel-reply-receipt">
        <div className="door-seal mx-auto mb-4"><Check className="h-6 w-6" strokeWidth={2} /></div>
        <p className="talk-display text-lg text-foreground">{receipt === "pending" ? "Awaiting review" : "Your reply is live"}</p>
        <p className="mx-auto mt-1.5 max-w-xs text-sm font-light text-muted-foreground">
          {receipt === "pending"
            ? `${firstName(ownerName)} will see your reply and decide whether it appears. No account needed.`
            : "Thanks for adding to the conversation."}
        </p>
        <button type="button" className="talk-pill mx-auto mt-4 !py-2 text-sm" onClick={() => { setReceipt(null); setBody(""); }} data-testid="channel-reply-again">Leave another</button>
      </div>
    );
  }

  const send = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      const res = await talkService.submitChannelReply({
        channelId: channel.id,
        origin,
        fromLabel: origin === "place" ? (myTalk?.address ?? "guest") : origin === "named" ? name.trim() || "someone" : "someone",
        fromAddress: origin === "place" ? myTalk?.address : undefined,
        body: body.trim(),
      });
      setReceipt(res.status);
      onSent();
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(msg === "members_only" ? "Join the channel to reply" : "This channel is not accepting replies");
    } finally { setBusy(false); }
  };

  return (
    <div className="talk-surface p-5" data-testid="channel-reply">
      <p className="mb-2 text-sm font-light text-muted-foreground">{MODE_NOTE[policy] ?? "Drop a reply."}</p>
      <textarea className="door-writing" placeholder="Write a reply…" value={body} onChange={(e) => setBody(e.target.value)} data-testid="channel-reply-input" />
      <div className="mt-2 border-t border-border/40 pt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5" data-testid="channel-send-as">
          <span className="text-sm font-light italic text-muted-foreground/80">Send as</span>
          <button type="button" className="door-sign" data-active={origin === "anonymous"} onClick={() => setOrigin("anonymous")} data-testid="send-as-anonymous">
            <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} /> Anonymous
          </button>
          {myTalk ? (
            <button type="button" className="door-sign" data-active={origin === "place"} onClick={() => setOrigin("place")} data-testid="send-as-place">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} /> From {TALK.domain}/{myTalk.address}
            </button>
          ) : (
            <button type="button" className="door-sign" data-active={origin === "named"} onClick={() => setOrigin("named")} data-testid="send-as-named">
              with a name
            </button>
          )}
        </div>
        {origin === "named" && (
          <input className="door-sign-input mt-2" placeholder="your name (optional)" value={name} onChange={(e) => setName(e.target.value)} data-testid="channel-reply-name" />
        )}
        <p className="mt-2 text-xs font-light text-muted-foreground/80" data-testid="channel-reply-hint">
          {origin === "place"
            ? `${firstName(ownerName)} can reply privately — this can become a Direct Talk.`
            : "Anonymous · one-way — the owner can't reply to you."}
        </p>
      </div>
      <button type="button" className="btn-moss mt-4 w-full justify-center disabled:opacity-50" onClick={send} disabled={busy || !body.trim()} data-testid="channel-reply-send">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Drop a reply
      </button>
    </div>
  );
}

function ClosedNote({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/40 py-4 text-sm text-muted-foreground" data-testid="channel-replies-closed">
      <Lock className="h-4 w-4" strokeWidth={1.5} /> {text}
    </div>
  );
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}
