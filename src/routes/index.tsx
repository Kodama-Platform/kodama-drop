import { createFileRoute } from "@tanstack/react-router";
import { TalkSurface } from "@/features/talk/screens/talk-surface";

export const Route = createFileRoute("/")({
  component: RootSurface,
});

function RootSurface() {
  return <TalkSurface />;
}
