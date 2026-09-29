import { site } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-4xl px-6 py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {site.author}
      </div>
    </footer>
  );
}
