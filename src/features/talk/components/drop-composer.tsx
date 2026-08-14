import { useEffect, useRef, useState } from "react";
import { ChevronDown, EyeOff, ImagePlus, Loader2, MapPin, Send, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Attachment, DropOrigin } from "@/features/talk/types";
import { Markdown } from "@/features/talk/lib/markdown";
import { fileToKeepsake } from "@/features/talk/lib/image";
import { talkService } from "@/features/talk/services";

const MAX_KEEPSAKES = 4;

/** Drop / message composer. Send in seconds — Enter to send, Shift+Enter newline. */
export function DropComposer({
  placeholder = "Drop a message…",
  labelPlaceholder,
  showLabel = false,
  busy = false,
  cta = "Send",
  attachments = [],
  allowImages = false,
  identityOptions = false,
  senderAddress,
  senderName,
  onSend,
  className,
  draftKey,
}: {
  placeholder?: string;
  labelPlaceholder?: string;
  showLabel?: boolean;
  busy?: boolean;
  cta?: string;
  attachments?: Attachment[];
  allowImages?: boolean;
  identityOptions?: boolean;
  senderAddress?: string;
  senderName?: string;
  onSend: (body: string, fromLabel?: string, keepsakes?: Attachment[], origin?: DropOrigin) => void;
  className?: string;
  draftKey?: string;
}) {
  const [body, setBody] = useState(() => (draftKey ? talkService.getDraft(draftKey) : ""));
  const [label, setLabel] = useState("");
  const [preview, setPreview] = useState(false);
  const [picked, setPicked] = useState<Attachment[]>([]);
  const [menu, setMenu] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Switching conversations: load that conversation's saved draft.
  useEffect(() => {
    if (!draftKey) return;
    setBody(talkService.getDraft(draftKey));
    setPreview(false);
    setPicked([]);
  }, [draftKey]);

  const hasBody = body.trim().length > 0;
  const canSubmit = hasBody || picked.length > 0;

  const change = (value: string) => {
    setBody(value);
    if (draftKey) talkService.saveDraft(draftKey, value);
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_KEEPSAKES - picked.length;
    const images = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, Math.max(0, room));
    if (images.length === 0) {
      toast.error(room <= 0 ? `Up to ${MAX_KEEPSAKES} pictures` : "Only images can be left here");
      return;
    }
    try {
      const next = await Promise.all(images.map(fileToKeepsake));
      setPicked((p) => [...p, ...next]);
    } catch {
      toast.error("Couldn't attach that picture");
    }
  };

  const submit = (origin: DropOrigin = "place") => {
    if (!canSubmit || busy) return;
    const fromLabel = origin === "named"
      ? (senderName?.trim() || undefined)
      : showLabel ? (label.trim() || undefined) : undefined;
    onSend(body.trim(), fromLabel, picked.length ? picked : undefined, origin);
    if (draftKey) talkService.saveDraft(draftKey, "");
    setBody("");
    setPreview(false);
    setPicked([]);
    setMenu(false);
  };

  return (
    <div className={cn("talk-composer", className)} data-testid="drop-composer">
      {showLabel && (
        <input
          className="w-full border-b border-border/50 bg-transparent px-4 py-2.5 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground/45"
          placeholder={labelPlaceholder ?? "How should they know you? (optional)"}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          data-testid="drop-composer-label"
        />
      )}
      {preview && hasBody ? (
        <div className="px-4 pt-3.5 pb-1" data-testid="drop-composer-preview">
          <Markdown text={body.trim()} className="md text-[0.975rem] font-light leading-relaxed text-foreground" />
        </div>
      ) : (
        <textarea
          className="talk-composer-field"
          placeholder={placeholder}
          value={body}
          rows={2}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit("place");
            }
          }}
          data-testid="drop-composer-field"
        />
      )}
      {picked.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-1 pt-1.5" data-testid="composer-keepsakes">
          {picked.map((a) => (
            <div key={a.id} className="talk-keepsake-chip group" data-testid="composer-keepsake">
              <img src={a.previewUrl} alt={a.name} />
              <button
                type="button"
                className="absolute right-0.5 top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-background/85 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                onClick={() => setPicked((p) => p.filter((x) => x.id !== a.id))}
                aria-label={`Remove ${a.name}`}
                data-testid="composer-keepsake-remove"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-1">
          {attachments.map((a) => (
            <span key={a.id} className="font-mono text-[0.7rem] text-muted-foreground">
              {a.name}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        <div className="flex items-center gap-2 pl-1">
          {allowImages && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }}
                data-testid="composer-image-input"
              />
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/8 hover:text-foreground"
                onClick={() => fileRef.current?.click()}
                aria-label="Leave a picture"
                title="Leave a picture"
                data-testid="composer-add-image"
              >
                <ImagePlus className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </>
          )}
          {hasBody ? (
            <div className="flex items-center gap-2" data-testid="drop-composer-writemode">
              <button type="button" className="door-sign !text-[0.82rem]" data-active={!preview} onClick={() => setPreview(false)} data-testid="drop-composer-write-tab">Write</button>
              <span className="text-muted-foreground/30">·</span>
              <button type="button" className="door-sign !text-[0.82rem]" data-active={preview} onClick={() => setPreview(true)} data-testid="drop-composer-preview-tab">Preview</button>
            </div>
          ) : (
            <span className="font-mono text-[0.66rem] text-muted-foreground/60">
              {picked.length > 0 ? "Add a note or just send it" : "Enter to send · Shift+Enter for a new line"}
            </span>
          )}
        </div>
        {identityOptions ? (
          <div className="relative flex items-center">
            <button
              type="button"
              className="btn-moss !rounded-r-none !px-4 !py-2 text-sm disabled:opacity-50"
              onClick={() => submit("place")}
              disabled={busy || !canSubmit}
              data-testid="drop-composer-send"
              title={senderAddress ? `Send from talk.kodama.page/${senderAddress}` : "Send from your place"}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
              {cta}
            </button>
            <button
              type="button"
              className="btn-moss !rounded-l-none !border-l !border-l-[rgb(var(--primary-foreground))]/25 !px-2 !py-2 disabled:opacity-50"
              onClick={() => setMenu((v) => !v)}
              disabled={busy || !canSubmit}
              aria-label="Choose how to send"
              data-testid="send-identity-toggle"
            >
              <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} aria-hidden="true" />
                <div className="absolute bottom-11 right-0 z-20 w-56 overflow-hidden rounded-xl border border-border/70 bg-card py-1 shadow-card" data-testid="send-identity-menu">
                  <IdentityItem icon={MapPin} title="Send from your place" sub={senderAddress ? `talk.kodama.page/${senderAddress}` : undefined} onClick={() => submit("place")} testid="send-as-place" />
                  <IdentityItem icon={UserRound} title={senderName ? `Send as ${senderName}` : "Send with my name"} sub="a name, no address" onClick={() => submit("named")} testid="send-as-named" />
                  <IdentityItem icon={EyeOff} title="Send anonymously" sub="no name, no address" onClick={() => submit("anonymous")} testid="send-as-anonymous" />
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="btn-moss !px-4 !py-2 text-sm disabled:opacity-50"
            onClick={() => submit("place")}
            disabled={busy || !canSubmit}
            data-testid="drop-composer-send"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            )}
            {cta}
          </button>
        )}
      </div>
    </div>
  );
}

function IdentityItem({ icon: Icon, title, sub, onClick, testid }: {
  icon: typeof MapPin;
  title: string;
  sub?: string;
  onClick: () => void;
  testid: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-primary/8"
      onClick={onClick}
      data-testid={testid}
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
      <span className="min-w-0">
        <span className="block truncate text-sm text-foreground">{title}</span>
        {sub && <span className="block truncate font-mono text-[0.62rem] text-muted-foreground/70">{sub}</span>}
      </span>
    </button>
  );
}
