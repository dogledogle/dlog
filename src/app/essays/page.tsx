import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { MDXContent } from "@/components/mdx-content";
import { Badge } from "@/components/ui/badge";
import { formatDay, publishedEssays } from "@/lib/essays";

export const metadata: Metadata = {
  title: "随笔",
  description: "即时的想法与生活片段。",
};

// 随笔正文直接渲染在列表页卡片里（微博式 feed），不设详情页。
export default function EssaysPage() {
  const essaysByYear = new Map<number, typeof publishedEssays>();
  for (const essay of publishedEssays) {
    const year = Number(essay.date.slice(0, 4));
    essaysByYear.set(year, [...(essaysByYear.get(year) ?? []), essay]);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">随笔</h1>
      <p className="mt-2 text-muted-foreground">
        即时的想法与生活片段，共 {publishedEssays.length} 篇
      </p>

      {publishedEssays.length === 0 ? (
        <EmptyState className="mt-16" title="还没有随笔" />
      ) : (
        <div className="mt-10 space-y-12">
          {[...essaysByYear.entries()].map(([year, essays]) => (
            <section key={year}>
              <h2 className="text-sm font-medium text-muted-foreground">
                {year}
              </h2>
              <div className="mt-4 space-y-5">
                {essays.map((essay) => (
                  <article
                    key={essay.slug}
                    className="rounded-xl border border-border bg-card p-6 shadow-sm"
                  >
                    <header>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        <time className="text-sm tabular-nums text-muted-foreground">
                          {formatDay(essay.date)}
                        </time>
                        {essay.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="rounded-full px-2 font-normal text-muted-foreground"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {essay.title && (
                        <h3 className="mt-2 font-medium">{essay.title}</h3>
                      )}
                    </header>
                    <div className="mt-1 text-[0.95rem]">
                      <MDXContent code={essay.body} variant="compact" />
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
