import { ThemeToggle } from "@/components/theme-toggle";

/** Talk theme toggle — light ↔ dark (dusk). Re-exports the shared toggle. */
export function TalkThemeToggle({ className }: { className?: string }) {
  return <ThemeToggle className={className} lightDarkOnly />;
}
