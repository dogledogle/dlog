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

// 简历：结构化内容全部放在 frontmatter（正文留空），/resume 页面负责渲染排版。
const resume = defineCollection({
  name: "resume",
  pattern: "resume/**/*.md",
  schema: s.object({
    slug: s.slug("resume"),
    name: s.string().max(40),
    subtitle: s.string().max(99),
    contacts: s.array(
      s.object({
        icon: s.enum(["user", "phone", "mail", "github"]),
        text: s.string().max(99),
      }),
    ),
    github: s.string(),
    advantage: s.string(),
    education: s.array(
      s.object({
        school: s.string().max(99),
        degree: s.string().max(20),
        major: s.string().max(99),
        time: s.string().max(40),
      }),
    ),
    skills: s.array(s.string()),
    work: s.array(
      s.object({
        company: s.string().max(99),
        department: s.string().max(40),
        time: s.string().max(40),
        hidden: s.boolean().default(false),
        duties: s.array(s.string()).default([]),
        achievements: s.array(s.string()).default([]),
      }),
    ),
    projects: s.array(
      s.object({
        name: s.string().max(99),
        url: s.string().optional(),
        time: s.string().max(40),
        intro: s.string().optional(),
        role: s.array(s.string()).default([]),
        actions: s.array(s.string()).default([]),
        results: s.array(s.string()).default([]),
      }),
    ),
    certificates: s.array(s.string()).default([]),
    socials: s.array(
      s.object({ name: s.string().max(40), url: s.string() }),
    ).default([]),
    thanks: s.string().optional(),
  }),
});

export default defineConfig({
  root: "content",
  collections: { posts, poems, essays, notes, resume },
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
