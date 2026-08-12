import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

import { slugSchema } from "@/lib/slug";
import { TALK } from "@/lib/brand";
import { TalkShell } from "@/features/talk/components/talk-shell";
import { TalkError } from "@/features/talk/components/states";
import { ChannelPublicScreen } from "@/features/talk/screens/channel-screen";

export const Route = createFileRoute("/$address_/$channel")({
  validateSearch: (s: Record<string, unknown>) => ({ invite: typeof s.invite === "string" ? s.invite : undefined }),
  component: ChannelRoute,
});

function ChannelRoute() {
  const { address, channel } = Route.useParams();
  const { invite } = Route.useSearch();
  const a = slugSchema.safeParse(address);
  const c = slugSchema.safeParse(channel);

  useEffect(() => {
    document.title = `${channel} · ${address} · ${TALK.name}`;
  }, [address, channel]);

  if (!a.success || !c.success) {
    return (
      <TalkShell centered>
        <TalkError title="Invalid address" body="That channel address can't be used." action={<Link to="/" className="btn-moss">Back home</Link>} />
      </TalkShell>
    );
  }
  return <ChannelPublicScreen placeAddress={a.data} slug={c.data} invite={invite} />;
}
