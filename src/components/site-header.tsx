"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";import { GithubIcon } from "@/components/icons";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const navLink =
  "rounded-md px-3 py-1.5 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:bg-accent/50";

const HEADER_HEIGHT = 56; // h-14
// 滞回量：下滑累计超过 8px 才收起、上滑超过 4px 才弹出，
// 避免触控板惯性滚动时页头来回抖动。
const HIDE_DELTA = 8;
const SHOW_DELTA = -4;

/** 简历页滚动行为：进入时正常显示，下滑页头上滑收起，上滑再滑回；靠近顶部强制显示。 */
function useScrollHide(enabled: boolean) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setHidden(false);
      return;
    }
    lastY.current = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const delta = y - lastY.current;
        lastY.current = y;
        if (y < HEADER_HEIGHT) {
          setHidden(false);
        } else if (delta > HIDE_DELTA) {
          setHidden(true);
        } else if (delta < SHOW_DELTA) {
          setHidden(false);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled]);

  return hidden;
}

export function SiteHeader() {
  const pathname = usePathname();
  // 目前只有简历页需要滚动收起，后续其他页面要加就扩这个判断。
  const hidden = useScrollHide(pathname === "/resume");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur transition-transform duration-300 motion-reduce:transition-none print:hidden",
        hidden && "-translate-y-full",
      )}
    >
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
        <Link
          href="/"
          className="rounded-md outline-none transition-colors hover:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span className="font-mono font-bold tracking-tight">
            {site.name}
            <span className="text-muted-foreground">()</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href} className={navLink}>
              {item.title}
            </Link>
          ))}
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub 主页"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:bg-accent/50"
          >
            <GithubIcon className="size-4" />
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
