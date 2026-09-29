"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// 全站右下角「返回顶部」：下滚超过半屏后浮现；
// 尊重系统「减弱动态效果」；焦点环与悬停样式和站内按钮一致。
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight / 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="返回顶部"
      onClick={() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
      }}
      className={cn(
        "fixed bottom-6 right-6 z-50 inline-flex size-10 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground shadow-md backdrop-blur outline-none transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <ArrowUp className="size-4" />
    </button>
  );
}
