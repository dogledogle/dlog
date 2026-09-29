import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { MDXContent } from "@/components/mdx-content";
import { Badge } from "@/components/ui/badge";
import { formatDay, publishedNotes } from "@/lib/notes";

export const metadata: Metadata = {
  title: "笔记",
  description: "碎片化的知识卡片。",
};

// 知识卡片在列表页直接读，不设详情页。
export default function NotesPage() {
  const notesByYear = new Map<number, typeof publishedNotes>();
  for (const note of publishedNotes) {
    const year = Number(note.date.slice(0, 4));
    notesByYear.set(year, [...(notesByYear.get(year) ?? []), note]);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">笔记</h1>
      <p className="mt-2 text-muted-foreground">
        碎片化的知识卡片，共 {publishedNotes.length} 条
      </p>

      {publishedNotes.length === 0 ? (
        <EmptyState className="mt-16" title="还没有笔记" />
      ) : (
        <div className="mt-10 space-y-12">
          {[...notesByYear.entries()].map(([year, notes]) => (
            <section key={year}>
              <h2 className="text-sm font-medium text-muted-foreground">
                {year} ({notes.length})
              </h2>
              {/* 单列卡片：笔记常含表格、代码块这类宽内容，宽度优先，不做多列瀑布流 */}
              <div className="mt-6 space-y-5">
                {notes.map((note) => (
                  <article
                    key={note.slug}
                    className="rounded-xl border border-border bg-card p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                      <time className="text-xs tabular-nums text-muted-foreground">
                        {formatDay(note.date)}
                      </time>
                      {note.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="rounded-full px-2 font-normal text-muted-foreground"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3 text-sm">
                      <MDXContent code={note.body} variant="compact" />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
