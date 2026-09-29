import { SectionTangram } from "@/components/section-tangram";
import { TerminalIntro, type StatusStat } from "@/components/terminal-intro";
import { site } from "@/config/site";
import { publishedEssays } from "@/lib/essays";
import { publishedPosts } from "@/lib/blog";
import { publishedNotes } from "@/lib/notes";
import { publishedPoems } from "@/lib/poems";

// 与七巧板五个板块一一对应，开张后计真实数量。
const sectionStats: StatusStat[] = [
  { label: "文章", value: publishedPosts.length, unit: "篇" },
  { label: "随笔", value: publishedEssays.length, unit: "篇" },
  { label: "笔记", value: publishedNotes.length, unit: "条" },
  { label: "诗", value: publishedPoems.length, unit: "首" },
  { label: "实验室", value: site.projects.length, unit: "个" },
];

const enter = (delay: number) => ({
  className:
    "motion-safe:animate-in motion-safe:fade-in motion-safe:fill-mode-both",
  style: { animationDuration: "600ms", animationDelay: `${delay}ms` },
});

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl space-y-16 px-6 py-16">
      <section {...enter(0)}>
        <TerminalIntro stats={sectionStats} />
      </section>

      <section {...enter(120)}>
        <SectionTangram />
      </section>
    </div>
  );
}
