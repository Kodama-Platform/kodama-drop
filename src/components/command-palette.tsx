import { useCallback, useEffect, useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  FileCode2,
  Focus,
  Keyboard,
  ListTree,
  Lock,
  Monitor,
  Moon,
  Palette,
  Save,
  Search,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import {
  applyTheme,
  getStoredTheme,
  setTheme as persistTheme,
  type Theme,
} from "@/lib/theme";
import {
  dispatchEditorEvent,
  EDITOR_EVENTS,
  getEditorCommandContext,
} from "@/lib/editor-commands";

/**
 * Global command palette — Cmd/Ctrl+K
 *
 * Context-aware: page actions light up on /:slug via editor command context.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [pageName, setPageName] = useState("");
  const [ctxTick, setCtxTick] = useState(0);
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setCtxTick((n) => n + 1);
  }, [open]);

  const path = router.state.location.pathname;
  const slugMatch = path.match(/^\/([^/]+)$/);
  const currentSlug = slugMatch && slugMatch[1] !== "" ? slugMatch[1] : null;
  const editorCtx = getEditorCommandContext();
  void ctxTick;

  const run = useCallback((fn: () => void | Promise<void>) => {
    return async () => {
      setOpen(false);
      await fn();
    };
  }, []);

  const setThemeAndToast = (t: Theme) => {
    persistTheme(t);
    applyTheme(t);
    toast.success(`Theme: ${t.charAt(0).toUpperCase() + t.slice(1)}`);
  };

  const copyLink = async () => {
    const url = window.location.origin + (currentSlug ? `/${currentSlug}` : "");
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", {
        icon: <Check className="h-4 w-4 animate-pop" />,
      });
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const goToPage = (slug: string) => {
    const trimmed = slug.trim().replace(/^\/+/, "");
    if (!trimmed) return;
    navigate({ to: "/$slug", params: { slug: trimmed } });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search actions or type a page name…"
        value={pageName}
        onValueChange={setPageName}
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        {pageName.trim() && (
          <CommandGroup heading="Navigate">
            <CommandItem
              onSelect={run(() => goToPage(pageName))}
              value={`open-${pageName}`}
            >
              <ArrowRight className="h-4 w-4" />
              Open <span className="text-muted-foreground">/{pageName.trim()}</span>
            </CommandItem>
          </CommandGroup>
        )}

        {currentSlug && (
          <CommandGroup heading="This page">
            <CommandItem onSelect={run(copyLink)} value="copy-link">
              <Copy className="h-4 w-4" /> Copy page link
              <CommandShortcut>⌘⇧C</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={run(() => dispatchEditorEvent(EDITOR_EVENTS.find))}
              value="find"
            >
              <Search className="h-4 w-4" /> Find
              <CommandShortcut>⌘F</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={run(() => dispatchEditorEvent(EDITOR_EVENTS.findReplace))}
              value="find-replace"
            >
              <Search className="h-4 w-4" /> Find & replace
              <CommandShortcut>⌘⇧H</CommandShortcut>
            </CommandItem>
            {editorCtx.canSave && (
              <CommandItem
                onSelect={run(() => dispatchEditorEvent(EDITOR_EVENTS.save))}
                value="save"
              >
                <Save className="h-4 w-4" /> Save workbook
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            )}
            <CommandItem
              onSelect={run(() => dispatchEditorEvent(EDITOR_EVENTS.toggleFocus))}
              value="focus"
            >
              <Focus className="h-4 w-4" /> Toggle focus mode
            </CommandItem>
            <CommandItem
              onSelect={run(() => dispatchEditorEvent(EDITOR_EVENTS.toggleMarkdownView))}
              value="markdown"
            >
              <FileCode2 className="h-4 w-4" /> Toggle markdown view
              <CommandShortcut>⌘⇧M</CommandShortcut>
            </CommandItem>
            {editorCtx.canEdit && (
              <CommandItem
                onSelect={run(() => dispatchEditorEvent(EDITOR_EVENTS.appearance))}
                value="appearance"
              >
                <Palette className="h-4 w-4" /> Note appearance
              </CommandItem>
            )}
            <CommandItem
              onSelect={run(() => dispatchEditorEvent(EDITOR_EVENTS.outline))}
              value="outline"
            >
              <ListTree className="h-4 w-4" /> Sheets & outline
            </CommandItem>
            {editorCtx.canLock && (
              <CommandItem
                onSelect={run(() => dispatchEditorEvent(EDITOR_EVENTS.lock))}
                value="lock"
              >
                <Lock className="h-4 w-4" /> Lock note
              </CommandItem>
            )}
            <CommandItem
              onSelect={run(() => dispatchEditorEvent(EDITOR_EVENTS.export))}
              value="export"
            >
              <Download className="h-4 w-4" /> Export note
            </CommandItem>
            <CommandItem
              onSelect={run(() => dispatchEditorEvent(EDITOR_EVENTS.shortcuts))}
              value="shortcuts"
            >
              <Keyboard className="h-4 w-4" /> Keyboard shortcuts
              <CommandShortcut>⌘/</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        )}

        {currentSlug && editorCtx.sheets.length > 1 && (
          <CommandGroup heading="Sheets">
            {editorCtx.sheets.map((sheet) => (
              <CommandItem
                key={sheet.sheetId}
                value={`sheet-${sheet.title}-${sheet.sheetId}`}
                onSelect={run(() =>
                  dispatchEditorEvent(EDITOR_EVENTS.switchSheet, {
                    sheetId: sheet.sheetId,
                  }),
                )}
              >
                <FileCode2 className="h-4 w-4" />
                {sheet.title}
                {sheet.sheetId === editorCtx.activeSheetId && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem onSelect={run(() => setThemeAndToast("light"))}>
            <Sun className="h-4 w-4" /> Light
            {getStoredTheme() === "light" && <Check className="ml-auto h-4 w-4" />}
          </CommandItem>
          <CommandItem onSelect={run(() => setThemeAndToast("dark"))}>
            <Moon className="h-4 w-4" /> Dark
            {getStoredTheme() === "dark" && <Check className="ml-auto h-4 w-4" />}
          </CommandItem>
          <CommandItem onSelect={run(() => setThemeAndToast("system"))}>
            <Monitor className="h-4 w-4" /> System
            {getStoredTheme() === "system" && <Check className="ml-auto h-4 w-4" />}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
