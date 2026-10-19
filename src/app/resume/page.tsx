import type { Metadata } from "next";
import { Link2, Mail, Phone, UserRound } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { GithubIcon } from "@/components/icons";
import { resume } from "#content";
import { GithubHeatmap } from "./github-heatmap";

export const metadata: Metadata = {
  title: { absolute: "刘东-前端开发简历" },
  description: "刘东的个人简历：6 年工作经验。",
};

const contactIcons: Record<string, ComponentType<{ className?: string }>> = {
  user: UserRound,
  phone: Phone,
  mail: Mail,
  github: GithubIcon,
};

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="border-b-2 border-foreground pb-1.5 text-lg font-semibold tracking-wide">
      {children}
    </h2>
  );
}

/** 渲染条目文本中的 **加粗** 片段：split 捕获分组后，奇数下标即加粗段，其余原样输出。 */
function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-foreground">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

function ItemList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={`list-disc pl-5 marker:text-foreground/70 ${className ?? ""}`}>
      {items.map((item) => (
        <li key={item} className="text-[15px] leading-6 text-foreground/90">
          <RichText text={item} />
        </li>
      ))}
    </ul>
  );
}

function LabeledList({ label, items }: { label: string; items: string[] }) {
  return (
    <>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{label}</h3>
      <ItemList items={items} className="mt-2" />
    </>
  );
}

function Time({ children }: { children: ReactNode }) {
  return (
    <span className="text-sm tabular-nums text-foreground/70">{children}</span>
  );
}

function EntryLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-sm font-medium text-foreground/70 underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
    >
      {url.replace(/^https?:\/\//, "")}
    </a>
  );
}

export default function ResumePage() {
  const r = resume[0];

  return (
    // 纸张式布局：版心与页头同宽（max-w-4xl px-6，正文 848px），纯色背景盖住底纹，无圆角/边框/内间距。
    // 打印时去掉横向内边距，内容铺满 A4 可打印区，仅留浏览器页边距。
    <div className="mx-auto w-full max-w-4xl px-6 py-12 print:px-0">
      <div className="bg-background">
        {/* 头部：姓名 / 一句话定位 / 联系方式 */}
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold tracking-[0.25em]">{r.name}</h1>
          <p className="text-sm text-foreground/70">{r.subtitle}</p>
          <ul className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm text-foreground/80">
            {r.contacts.map((c) => {
              const Icon = contactIcons[c.icon];
              return (
                <li key={c.text} className="flex items-center gap-1.5">
                  {Icon && (
                    <Icon className="size-3.5 text-foreground/70" aria-hidden />
                  )}
                  {c.text}
                </li>
              );
            })}
            <li className="flex items-center gap-1.5">
              <a
                href={r.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <GithubIcon className="size-3.5 text-foreground/70" aria-hidden />
                {r.github.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            </li>
          </ul>
        </header>

        <div className="mt-10 space-y-12">
          <GithubHeatmap
            username={r.github
              .replace(/^https?:\/\/(www\.)?github\.com\//, "")
              .replace(/\/$/, "")}
          />
          <section>
            <SectionTitle>个人简介</SectionTitle>
            <p className="mt-3 text-[15px] leading-6 text-foreground/90">
              {r.advantage}
            </p>
          </section>

          <section>
            <SectionTitle>专业技能</SectionTitle>
            <ItemList items={r.skills} className="mt-4" />
          </section>

          <section>
            <SectionTitle>工作经历</SectionTitle>
            {r.work
              .filter((w) => !w.hidden)
              .map((w) => (
              <div key={w.company} className="mt-6 first:mt-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-lg font-bold">
                    {w.company}
                    <span className="ml-3 text-sm font-normal text-foreground/70">
                      {w.department}
                    </span>
                  </h3>
                  <Time>{w.time}</Time>
                </div>
                {/* 业绩以次要内容（小号浅色）紧跟公司行，工作内容作为主列表排在其后。 */}
                {w.achievements.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {w.achievements.map((a) => (
                      <li key={a} className="text-sm leading-6 text-foreground/70">
                        <RichText text={a} />
                      </li>
                    ))}
                  </ul>
                )}
                {w.duties.length > 0 && (
                  <ItemList items={w.duties} className="mt-3" />
                )}
              </div>
            ))}
          </section>

          <section>
            <SectionTitle>项目经历</SectionTitle>
            {r.projects.map((p) => (
              <div key={p.name} className="mt-6 first:mt-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-lg font-bold">
                    {p.name}
                    {p.role.length > 0 && (
                      <span className="ml-3 text-sm font-normal text-foreground/70">
                        {p.role.join(" / ")}
                      </span>
                    )}
                  </h3>
                  <Time>{p.time}</Time>
                </div>
                {p.intro && (
                  <p className="mt-2 text-[15px] leading-6 text-foreground/70">
                    {p.intro}
                    {p.url && (
                      <>
                        （<EntryLink url={p.url} />）
                      </>
                    )}
                  </p>
                )}
                <LabeledList label="内容" items={p.actions} />
                <LabeledList label="结果" items={p.results} />
              </div>
            ))}
          </section>

          <section>
            <SectionTitle>教育经历</SectionTitle>
            {r.education.map((e) => (
              <div key={e.school} className="mt-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="font-bold">
                    {e.school}
                    <span className="ml-3 text-sm font-normal text-foreground/70">
                      {e.degree} · {e.major}
                    </span>
                  </span>
                  <Time>{e.time}</Time>
                </div>
              </div>
            ))}
          </section>

          {r.certificates.length > 0 && (
            <section>
              <SectionTitle>资格证书</SectionTitle>
              <ul className="mt-4 space-y-1">
                {r.certificates.map((c) => (
                  <li key={c} className="text-[15px] leading-6 text-foreground/90">
                    <RichText text={c} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {r.socials.length > 0 && (
            <section>
              <SectionTitle>社交主页</SectionTitle>
              <ul className="mt-4 space-y-2">
                {r.socials.map((s) => {
                  const isGithub = /github\.com/.test(s.url);
                  const Icon = isGithub ? GithubIcon : Link2;
                  return (
                    <li
                      key={s.url}
                      className="flex items-center gap-2 text-[15px]"
                    >
                      <Icon className="size-4 text-foreground/70" aria-hidden />
                      <span className="font-medium">{s.name}：</span>
                      <EntryLink url={s.url} />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {r.thanks && (
            <section>
              <SectionTitle>致谢</SectionTitle>
              <p className="mt-3 text-[15px] leading-6 text-foreground/70">
                {r.thanks}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
