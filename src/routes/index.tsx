import { createFileRoute } from "@tanstack/react-router";
import { LandingScreen } from "@/features/talk/screens/landing-screen";

export const Route = createFileRoute("/")({
  component: LandingScreen,
});
