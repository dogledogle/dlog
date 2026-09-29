import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { defineCollection, defineConfig, s } from "velite";

const posts = defineCollection({
  name: "posts",
  pattern: "blog/**/*.mdx",
  schema: s.object({
    slug: s.slug("blog"),
    title: s.string().max(99),
    date: s.isodate(),
    summary: s.string().max(300).optional(),
    tags: s.array(s.string()).default([]),
    draft: s.boolean().default(false),
    body: s.mdx(),
  }),
});

// 诗集：s.raw() 原样保留正文（含换行），一行一句。
// date 为排序分组用的规范日期；written 保留笔记本上的原始落款（含「早/晚」）。
const poems = defineCollection({
  name: "poems",
  pattern: "poems/**/*.md",
  schema: s.object({
    slug: s.slug("poems"),
    title: s.string().max(99).optional(),
    date: s.isodate(),
    written: s.string().max(60).optional(),
    body: s.raw(),
  }),
});

// 随笔：即时的想法与生活片段，正文直接渲染在列表页卡片里，不设详情页。
const essays = defineCollection({
  name: "essays",
  pattern: "essays/**/*.mdx",
  schema: s.object({
    slug: s.slug("essays"),
    title: s.string().max(99).optional(),
    date: s.isodate(),
    tags: s.array(s.string()).default([]),
    draft: s.boolean().default(false),
    body: s.mdx(),
  }),
});

// 笔记：碎片化的知识卡片，正文支持 markdown（代码块、表格等），在卡片上直接渲染，不设详情页。
const notes = defineCollection({
  name: "notes",
  pattern: "notes/**/*.md",
  schema: s.object({
    slug: s.slug("notes"),
    date: s.isodate(),
    tags: s.array(s.string()).default([]),
    draft: s.boolean().default(false),
    body: s.mdx(),
  }),
});

export default defineConfig({
  root: "content",
  collections: { posts, poems, essays, notes },
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: "one-dark-pro",
          keepBackground: true,
        },
      ],
    ],
  },
});
