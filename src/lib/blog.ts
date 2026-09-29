import { posts } from "#content";

export type Post = (typeof posts)[number];

export const publishedPosts = posts
  .filter((post) => !post.draft)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export function getPostBySlug(slug: string) {
  return publishedPosts.find((post) => post.slug === slug);
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
