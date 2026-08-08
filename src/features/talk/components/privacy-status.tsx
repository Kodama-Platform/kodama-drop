import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PrivacyStatus as PrivacyStatusType } from "@/features/talk/types";

/**
 * Calm, honest privacy signal — private-by-default, never alarming.
 * Shows the design guarantee; the honest preview caveat lives in the tooltip
 * and in the optional expanded text. Never claims more than the adapter reports.
 */
export function PrivacyStatus({
  status,
  withText = false,
  className,
}: {
  status: PrivacyStatusType;
  withText?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("talk-privacy talk-privacy--calm", className)}
      title={status.description}
      data-testid="privacy-status"
      data-level={status.level}
    >
      <Lock className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
      {status.label}
      {withText && (
        <span className="ml-1 font-sans font-light normal-case tracking-normal opacity-80">
          — {status.description}
        </span>
      )}
    </span>
  );
}
