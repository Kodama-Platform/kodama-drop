import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  applyTheme,
  getStoredTheme,
  resolveTheme,
  setTheme,
  watchSystemTheme,
  type Theme,
} from "@/lib/theme";

type ThemeToggleProps = {
  className?: string;
  /** When true, toggles only light ↔ dark (no system). */
  lightDarkOnly?: boolean;
};

export function ThemeToggle({ className, lightDarkOnly = false }: ThemeToggleProps) {
  const [theme, setLocal] = useState<Theme>("system");

  useEffect(() => {
    const t = getStoredTheme();
    setLocal(t);
    applyTheme(t);
    const unsub = watchSystemTheme(() => {
      if (getStoredTheme() === "system") applyTheme("system");
    });
    return unsub;
  }, []);

  const cycle = () => {
    let next: Theme;
    if (lightDarkOnly) {
      const resolved = resolveTheme(theme);
      next = resolved === "dark" ? "light" : "dark";
    } else {
      // Cycle light → dark → system
      next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    }
    setLocal(next);
    setTheme(next);
  };

  const resolved = resolveTheme(theme);
  const Icon =
    !lightDarkOnly && theme === "system" ? Monitor : resolved === "dark" ? Moon : Sun;
  const label = lightDarkOnly
    ? `Appearance: ${resolved}`
    : `Theme: ${theme}`;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={cycle}
      data-testid="theme-toggle"
      className={
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:scale-105 hover:text-foreground " +
        (className ?? "")
      }
    >
      <Icon className="h-4 w-4" strokeWidth={1.5} />
    </button>
  );
}
