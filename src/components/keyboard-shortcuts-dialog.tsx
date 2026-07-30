import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ShortcutRow = {
  keys: string;
  label: string;
};

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

function modKey(): string {
  return isMac ? "⌘" : "Ctrl";
}

function shortcutRows(): ShortcutRow[] {
  const mod = modKey();
  return [
    { keys: `${mod}K`, label: "Command palette" },
    { keys: `${mod}/`, label: "Keyboard shortcuts" },
    { keys: `${mod}S`, label: "Save workbook" },
    { keys: `${mod}F`, label: "Find" },
    { keys: `${mod}⇧H`, label: "Find & replace" },
    { keys: `${mod}⇧M`, label: "Toggle markdown view" },
    { keys: `${mod}⇧C`, label: "Copy read-only link" },
    { keys: "Esc", label: "Close find, markdown view, or focus mode" },
  ];
}

type KeyboardShortcutsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const rows = shortcutRows();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 sm:rounded-xl" aria-describedby={undefined}>
        <DialogHeader className="border-b border-border/60 px-5 py-4">
          <DialogTitle className="font-display text-lg font-medium tracking-tight">
            Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>
        <ul className="max-h-[min(60vh,24rem)] space-y-0 overflow-y-auto px-2 py-2">
          {rows.map((row) => (
            <li
              key={row.keys}
              className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm"
            >
              <span className="font-light text-foreground">{row.label}</span>
              <kbd className="shrink-0 rounded-md border border-border/70 bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                {row.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
