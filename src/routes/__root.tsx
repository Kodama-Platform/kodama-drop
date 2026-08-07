import { Outlet, Link, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { TalkShell } from "@/features/talk/components/talk-shell";
import { TalkEmpty, TalkError } from "@/features/talk/components/states";

function NotFoundComponent() {
  return (
    <TalkShell centered>
      <TalkEmpty
        title="No place here"
        body="This page doesn't exist. Every Talk address is a place — pick a name to claim your own."
        action={
          <Link to="/" className="btn-moss" data-testid="notfound-home">
            Back to Kodama Talk
          </Link>
        }
      />
    </TalkShell>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <TalkShell centered>
      <TalkError
        body="Try again, or head back to the front door."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={reset} className="btn-moss">
              Try again
            </button>
            <a href="/" className="talk-pill">
              Home
            </a>
          </div>
        }
      />
    </TalkShell>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}
