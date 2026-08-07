import { Lock, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PrivacyStatus as PrivacyStatusType } from "@/features/talk/types";

/** Honest privacy indicator — never claims more than the adapter reports. */
export function PrivacyStatus({
  status,
  withText = false,
  className,
}: {
  status: PrivacyStatusType;
  withText?: boolean;
  className?: string;
}) {
  const planned = status.level === "private-planned";
  const Icon = planned ? Lock : ShieldQuestion;
  return (
    <span
      className={cn(
        "talk-privacy",
        planned ? "talk-privacy--planned" : "talk-privacy--mock",
        className,
      )}
      title={status.description}
      data-testid="privacy-status"
      data-level={status.level}
    >
      <Icon className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
      {status.label}
      {withText && (
        <span className="ml-1 font-sans font-light normal-case tracking-normal opacity-80">
          — {status.description}
        </span>
      )}
    </span>
  );
}
