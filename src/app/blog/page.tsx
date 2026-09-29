import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { CnblogsIcon, JuejinIcon } from "@/components/icons";
import { site } from "@/config/site";
import { formatDate, publishedPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "文章",
  description: "所有文章，按年份归档。",
};

export default function BlogPage() {
  const postsByYear = new Map<number, typeof publishedPosts>();
  for (const post of publishedPosts) {
    const year = Number(post.date.slice(0, 4));
    postsByYear.set(year, [...(postsByYear.get(year) ?? []), post]);
  }

  return (
    // 最小高度 = 视口 - 页头(57px: h-14+边框) - 页脚(53px: py-4+行高+边框)，
    // 空状态在剩余空间垂直居中；页头/页脚高度若调整需同步这里的 110px。
    <div className="mx-auto flex min-h-[calc(100svh-110px)] w-full max-w-4xl flex-col px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">文章</h1>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>共 {publishedPosts.length} 篇</p>
        <div className="flex items-center gap-3">
          <a
            href={site.juejin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="掘金主页"
            title="掘金"
            className="inline-flex items-center outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <JuejinIcon className="size-4" />
          </a>
          <a
            href={site.cnblogs}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="博客园主页"
            title="博客园"
            className="inline-flex items-center outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <CnblogsIcon className="size-4" />
          </a>
        </div>
      </div>

      {publishedPosts.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState title="还没有文章" />
        </div>
      )}

      <div className="mt-10 space-y-12">
        {[...postsByYear.entries()].map(([year, posts]) => (
          <section key={year}>
            <h2 className="text-sm font-medium text-muted-foreground">{year}</h2>
            <ul className="mt-4">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block rounded-lg px-3 py-4 transition-colors duration-200 hover:bg-muted/60"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <span className="font-medium">{post.title}</span>
                      <time className="text-sm tabular-nums text-muted-foreground">
                        {formatDate(post.date)}
                      </time>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
