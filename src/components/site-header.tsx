import Link from "next/link";
import { GithubIcon } from "@/components/icons";
import { site } from "@/config/site";
import { ThemeToggle } from "./theme-toggle";

const navLink =
  "rounded-md px-3 py-1.5 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:bg-accent/50";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
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
