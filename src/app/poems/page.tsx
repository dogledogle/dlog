import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { publishedPoems } from "@/lib/poems";

export const metadata: Metadata = {
  title: "诗集",
  description: "多格的诗，从 2013 年写起。",
};

export default function PoemsPage() {
  const poemsByYear = new Map<number, typeof publishedPoems>();
  for (const poem of publishedPoems) {
    const year = Number(poem.date.slice(0, 4));
    poemsByYear.set(year, [...(poemsByYear.get(year) ?? []), poem]);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {publishedPoems.length === 0 && (
        <EmptyState className="mt-16" title="还没有诗" />
      )}

      {/* 年份时间轴：左侧竖线贯穿各年份，一条流光沿线巡游 */}
      <div className="poem-timeline space-y-16">
        {[...poemsByYear.entries()].map(([year, poems]) => (
          <section key={year} className="relative pl-6">
            <span aria-hidden className="poem-timeline-node" />
            <h2 className="text-sm font-medium text-muted-foreground">
              {year} ({poems.length})
            </h2>
            {/* 瀑布流：CSS 多列布局，卡片高度不一自然错落；窄屏退化为单列 */}
            <div className="mt-6 columns-1 gap-5 sm:columns-2">
              {poems.map((poem) => (
                <article
                  key={poem.slug}
                  className="mb-5 break-inside-avoid rounded-xl border border-border bg-card p-6 text-center shadow-sm"
                >
                  {poem.title ? (
                    <h3 className="font-serif text-lg font-semibold tracking-wide">
                      {poem.title}
                    </h3>
                  ) : null}
                  {poem.written ? (
                    <p className="mt-1 font-serif text-sm tabular-nums text-muted-foreground">
                      {poem.written}
                    </p>
                  ) : null}
                  <div className="poem-body mt-4 space-y-6 font-serif text-[1.05rem] leading-9 text-foreground/90">
                    {poem.body
                      .split(/\n\s*\n/)
                      .filter((stanza) => stanza.trim())
                      .map((stanza, i) => (
                        <p key={i} className="whitespace-pre-line">
                          {stanza.trim()}
                        </p>
                      ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
