import { cn } from "@/lib/utils";
import { TALK } from "@/lib/brand";

type ReadonlyProps = {
  address: string;
  host?: string;
  className?: string;
  editable?: false;
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

/** The Talk address, rendered like a nameplate: talk.kodama.page / name */
export function TalkAddressPlaque(props: Props) {
  const host = props.host ?? TALK.domain;

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

  return (
    <span className={cn("talk-plaque", props.className)} data-testid="address-plaque">
      <span className="talk-plaque-host">{host}</span>
      <span className="talk-plaque-slash">/</span>
      <span className="talk-plaque-name">{props.address}</span>
    </span>
  );
}
