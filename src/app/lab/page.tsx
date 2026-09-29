import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "实验室",
  description: "开源作品与小工具。",
};

// 编号 hover 变项目语言色：颜色走 CSS 变量，避免为每个项目生成一组动态类名。
export default function LabPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">实验室</h1>
      <p className="mt-2 text-muted-foreground">
        开源作品与小工具，共 {site.projects.length} 个
      </p>

      <ol className="mt-10">
        {site.projects.map((project, index) => (
          <li key={project.name}>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ "--lang": project.languageColor } as CSSProperties}
              className="-mx-6 flex gap-5 border-b border-border px-6 py-7 transition-colors duration-200 outline-none first:border-t hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:gap-8 sm:py-8"
            >
              <span
                aria-hidden
                className="font-mono text-2xl leading-none font-medium tabular-nums text-muted-foreground/70 transition-colors duration-200 group-hover:text-(--lang) sm:text-3xl"
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <h3 className="break-words font-mono text-xl leading-snug font-semibold tracking-tight sm:text-2xl">
                    {project.name}
                  </h3>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        aria-hidden
                        className="size-2.5 rounded-full border border-border"
                        style={{ backgroundColor: project.languageColor }}
                      />
                      {project.language}
                    </p>
                    <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>
                </div>
                <p className="mt-2.5 max-w-prose text-sm leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
              </div>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
