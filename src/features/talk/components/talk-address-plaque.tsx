import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TALK } from "@/lib/brand";
import { copyText } from "@/features/talk/lib/clipboard";

type ReadonlyProps = {
  address: string;
  host?: string;
  className?: string;
  editable?: false;
  /** Tap to copy the full URL. Default true. */
  copyable?: boolean;
};

type EditableProps = {
  host?: string;
  className?: string;
  editable: true;
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
};

type Props = ReadonlyProps | EditableProps;

/** The Talk address as a nameplate: talk.kodama.page / name — tap to copy. */
export function TalkAddressPlaque(props: Props) {
  const host = props.host ?? TALK.domain;
  const [copied, setCopied] = useState(false);

  if (props.editable) {
    return (
      <label className={cn("talk-plaque", props.className)} data-testid="address-plaque-editable">
        <span className="talk-plaque-host">{host}</span>
        <span className="talk-plaque-slash">/</span>
        <input
          className="talk-plaque-input"
          data-testid="address-plaque-input"
          value={props.value}
          placeholder={props.placeholder ?? "your-name"}
          autoFocus={props.autoFocus}
          onChange={(e) => props.onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") props.onSubmit?.();
          }}
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          aria-label="Talk address"
        />
      </label>
    );
  }

  const copyable = props.copyable !== false;
  const url = `https://${host}/${props.address}`;

  const copy = async () => {
    if (await copyText(url)) {
      setCopied(true);
      toast.success("Address copied");
      setTimeout(() => setCopied(false), 1600);
    } else {
      toast.error("Couldn't copy — long-press to copy manually");
    }
  };

  if (!copyable) {
    return (
      <span className={cn("talk-plaque", props.className)} data-testid="address-plaque">
        <span className="talk-plaque-host">{host}</span>
        <span className="talk-plaque-slash">/</span>
        <span className="talk-plaque-name">{props.address}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn("talk-plaque group", props.className)}
      data-testid="address-plaque"
      title="Tap to copy your address"
      aria-label={`Copy ${url}`}
    >
      <span className="talk-plaque-host">{host}</span>
      <span className="talk-plaque-slash">/</span>
      <span className="talk-plaque-name">{props.address}</span>
      {copied ? (
        <Check className="ml-1.5 h-3.5 w-3.5 text-primary" strokeWidth={2} aria-hidden="true" />
      ) : (
        <Copy className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-hover:text-primary" strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  );
}
