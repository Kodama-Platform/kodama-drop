import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { KodamaMark } from "@/components/kodama-mark";
import { ForestAtmosphere } from "@/components/site/forest-atmosphere";
import { SpiritCursor } from "@/components/site/spirit-cursor";
import { TALK, KODAMA_PLACES } from "@/lib/brand";
import { TalkThemeToggle } from "@/features/talk/components/talk-theme-toggle";
import { OwnerReturnBadge } from "@/features/talk/components/owner-return-badge";

type TalkShellProps = {
  children: ReactNode;
  /** Center content vertically (Door / gates). */
  centered?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  atmosphere?: boolean;
  /** Lock to viewport so inner panes scroll (Shelf / Stream). */
  fillViewport?: boolean;
  headerAction?: ReactNode;
};

/** The one shell for every Talk surface. Quiet dusk atmosphere, thin chrome. */
export function TalkShell({
  children,
  centered = false,
  showHeader = true,
  showFooter = false,
  atmosphere = true,
  fillViewport = false,
  headerAction,
}: TalkShellProps) {
  return (
    <div
      className={`relative flex flex-col overflow-x-clip bg-background text-foreground ${
        fillViewport ? "h-dvh min-h-0 overflow-hidden" : "min-h-screen"
      }`}
    >
      <SpiritCursor />
      {atmosphere && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 opacity-50">
          <ForestAtmosphere />
        </div>
      )}

      <div className={`relative z-10 flex flex-col ${fillViewport ? "h-full min-h-0" : "min-h-screen"}`}>
        {showHeader && (
          <header className="flex items-center justify-between px-5 py-4 sm:px-8">
            <Link to="/" state={{ fresh: true } as never} className="group inline-flex items-center gap-2.5" data-testid="talk-home-link">
              <KodamaMark size={26} />
              <span className="flex items-baseline gap-1.5">
                <span className="font-display text-lg font-medium tracking-tight text-foreground">
                  Kodama
                </span>
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-primary">
                  {TALK.wordmark}
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2.5">
              <OwnerReturnBadge />
              {headerAction}
              <TalkThemeToggle />
            </div>
          </header>
        )}

        <main
          id="main"
          className={`flex-1 ${
            centered ? "flex items-center justify-center px-5 py-10" : ""
          } ${fillViewport ? "flex min-h-0 flex-col" : ""}`}
        >
          {children}
        </main>

        {showFooter && (
          <footer className="border-t border-border/50 px-5 py-10 sm:px-8">
            <div className="mx-auto flex max-w-5xl flex-col gap-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="talk-display text-lg text-foreground">Own your place.</p>
                  <p className="mt-2 max-w-sm text-sm font-light leading-relaxed text-muted-foreground">
                    {TALK.privacyLine}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 self-end">
                  {KODAMA_PLACES.map((p) => (
                    <a
                      key={p.name}
                      href={p.href}
                      className="group rounded-xl border border-border/60 p-3 transition-colors hover:border-primary/40"
                    >
                      <span className="flex items-center gap-1.5 font-display text-sm font-medium text-foreground">
                        {p.name}
                        {"soon" in p && p.soon && (
                          <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-muted-foreground">
                            soon
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs font-light text-muted-foreground">
                        {p.promise}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground/60">
                {TALK.domain} · One URL. One purpose. No account.
              </p>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
