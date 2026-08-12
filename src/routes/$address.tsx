import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

import { slugSchema } from "@/lib/slug";
import { TALK } from "@/lib/brand";
import { TalkShell } from "@/features/talk/components/talk-shell";
import { TalkError } from "@/features/talk/components/states";
import { TalkSurface } from "@/features/talk/screens/talk-surface";

export const Route = createFileRoute("/$address")({
  component: AddressRoute,
});

function AddressRoute() {
  const { address } = Route.useParams();
  const parsed = slugSchema.safeParse(address);

  useEffect(() => {
    document.title = `${address} · ${TALK.name}`;
  }, [address]);

  if (!parsed.success) {
    return (
      <TalkShell centered>
        <TalkError
          title="Invalid address"
          body={parsed.error.issues[0]?.message ?? "That address can't be used."}
          action={
            <Link to="/" className="btn-moss">
              Back home
            </Link>
          }
        />
      </TalkShell>
    );
  }

  return <TalkSurface initialAddress={parsed.data} />;
}
