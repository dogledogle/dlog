"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <span className="inline-block size-9" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";
  const iconClass =
    "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in motion-safe:duration-300";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "切换到亮色主题" : "切换到暗色主题"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="transition-transform active:scale-90"
    >
      {isDark ? (
        <Sun key="sun" className={iconClass} />
      ) : (
        <Moon key="moon" className={iconClass} />
      )}
    </Button>
  );
}
