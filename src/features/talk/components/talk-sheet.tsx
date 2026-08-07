import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/** Sheet / dialog for Talk flows (claim, unlock, settings). */
export function TalkSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="talk-sheet-overlay" />
        <Dialog.Content className="talk-sheet-panel" data-testid="talk-sheet">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="talk-display text-xl text-foreground">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm font-light text-muted-foreground">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close"
              data-testid="talk-sheet-close"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </Dialog.Close>
          </div>
          {children}
          {footer && <div className="mt-6">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
