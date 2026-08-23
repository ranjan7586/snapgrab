"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Avoid a hydration mismatch: the server can't know the real theme, so we
  // render a neutral placeholder until after the first client render. This
  // one-time mount flag is the pattern next-themes' own docs recommend.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-shot mount flag, not a cascading update.
    setMounted(true);
  }, []);

  if (!mounted) return <div className="size-9" aria-hidden />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="glass flex size-9 items-center justify-center rounded-full text-foreground/80 transition hover:text-foreground hover:border-accent-violet/50"
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
