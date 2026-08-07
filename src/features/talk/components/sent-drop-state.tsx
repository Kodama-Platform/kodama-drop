import { Check, CheckCheck, Clock, Loader2 } from "lucide-react";
import type { DropStatus } from "@/features/talk/types";

const MAP: Record<DropStatus, { label: string; icon: typeof Check }> = {
  sending: { label: "Sending", icon: Loader2 },
  sent: { label: "Sent", icon: Check },
  delivered: { label: "Delivered", icon: CheckCheck },
  accepted: { label: "Accepted", icon: Clock },
};

/** Tiny status line for a sent Drop. */
export function SentDropState({ status }: { status: DropStatus }) {
  const { label, icon: Icon } = MAP[status];
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-[0.66rem] text-muted-foreground/75"
      data-testid="sent-drop-state"
      data-status={status}
    >
      <Icon
        className={`h-3 w-3 ${status === "sending" ? "animate-spin" : ""} ${
          status === "delivered" ? "text-primary" : ""
        }`}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
