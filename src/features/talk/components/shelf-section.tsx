import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A labelled section on the owner's Shelf. */
export function ShelfSection({
  label,
  count,
  action,
  children,
  className,
}: {
  label: string;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)} data-testid={`shelf-section-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center justify-between">
        <h2 className="talk-section-label flex items-center gap-2">
          {label}
          {typeof count === "number" && (
            <span className="rounded-full bg-primary/10 px-1.5 text-[0.62rem] text-primary">
              {count}
            </span>
          )}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
