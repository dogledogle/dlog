import { runSync } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Callout } from "./mdx/callout";

/*
 * MDX 组件注册表 —— 文章里可以直接使用的自定义组件都登记在这里。
 * 新增小功能的固定流程：
 *   1. 在 src/components/mdx/ 下写一个组件
 *   2. 在下面的 registry 里加一行
 *   3. 之后任何文章里直接写 <组件名 /> 即可
 */
const registry = { Callout };

const typography = {
  h2: (p: ComponentPropsWithoutRef<"h2">) => (
    <h2 {...p} className="mt-12 mb-4 text-2xl font-semibold tracking-tight" />
  ),
  h3: (p: ComponentPropsWithoutRef<"h3">) => (
    <h3 {...p} className="mt-8 mb-3 text-xl font-semibold tracking-tight" />
  ),
  p: (p: ComponentPropsWithoutRef<"p">) => <p {...p} className="my-5 leading-8" />,
  a: (p: ComponentPropsWithoutRef<"a">) => (
    <a
      {...p}
      className="font-medium underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
    />
  ),
  ul: (p: ComponentPropsWithoutRef<"ul">) => (
    <ul
      {...p}
      className="my-5 list-disc space-y-2 pl-6 marker:text-muted-foreground"
    />
  ),
  ol: (p: ComponentPropsWithoutRef<"ol">) => (
    <ol
      {...p}
      className="my-5 list-decimal space-y-2 pl-6 marker:text-muted-foreground"
    />
  ),
  blockquote: (p: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      {...p}
      className="my-6 border-l-2 border-border pl-4 text-muted-foreground [&>p]:my-1 [&>p]:leading-8"
    />
  ),
  hr: (p: ComponentPropsWithoutRef<"hr">) => (
    <hr {...p} className="my-10 border-border" />
  ),
  table: (p: ComponentPropsWithoutRef<"table">) => (
    <div className="my-6 overflow-x-auto">
      <table
        {...p}
        className="w-full border-collapse text-sm leading-7 [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium"
      />
    </div>
  ),
  pre: (p: ComponentPropsWithoutRef<"pre">) => (
    <pre
      {...p}
      className="my-6 overflow-x-auto rounded-xl border border-black/10 p-4 text-[0.85rem] leading-7 dark:border-white/10"
    />
  ),
};

// 随笔 feed 卡片内的紧凑排版：间距整体收紧、正文行高略小；a/table 沿用文章样式。
const compactTypography = {
  ...typography,
  h2: (p: ComponentPropsWithoutRef<"h2">) => (
    <h2 {...p} className="mt-6 mb-2 text-lg font-semibold tracking-tight" />
  ),
  h3: (p: ComponentPropsWithoutRef<"h3">) => (
    <h3 {...p} className="mt-4 mb-2 text-base font-semibold tracking-tight" />
  ),
  p: (p: ComponentPropsWithoutRef<"p">) => <p {...p} className="my-3 leading-7" />,
  ul: (p: ComponentPropsWithoutRef<"ul">) => (
    <ul
      {...p}
      className="my-3 list-disc space-y-1.5 pl-6 marker:text-muted-foreground"
    />
  ),
  ol: (p: ComponentPropsWithoutRef<"ol">) => (
    <ol
      {...p}
      className="my-3 list-decimal space-y-1.5 pl-6 marker:text-muted-foreground"
    />
  ),
  blockquote: (p: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      {...p}
      className="my-4 border-l-2 border-border pl-3 text-muted-foreground [&>p]:my-1 [&>p]:leading-7"
    />
  ),
  hr: (p: ComponentPropsWithoutRef<"hr">) => (
    <hr {...p} className="my-6 border-border" />
  ),
  pre: (p: ComponentPropsWithoutRef<"pre">) => (
    <pre
      {...p}
      className="my-4 overflow-x-auto rounded-xl border border-black/10 p-3 text-[0.8rem] leading-6 dark:border-white/10"
    />
  ),
};

export function MDXContent({
  code,
  variant = "article",
}: {
  code: string;
  variant?: "article" | "compact";
}) {
  const { default: Content } = runSync(code, {
    ...runtime,
  }) as { default: (props: { components?: Record<string, unknown> }) => ReactNode };

  return (
    <Content
      components={{
        ...registry,
        ...(variant === "compact" ? compactTypography : typography),
      }}
    />
  );
}
