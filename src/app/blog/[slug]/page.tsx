import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXContent } from "@/components/mdx-content";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, getPostBySlug, publishedPosts } from "@/lib/blog";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return publishedPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <header>
        <time className="text-sm tabular-nums text-muted-foreground">
          {formatDate(post.date)}
        </time>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {post.title}
        </h1>
        {post.summary && (
          <p className="mt-4 leading-7 text-muted-foreground">{post.summary}</p>
        )}
        {post.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li key={tag}>
                <Badge
                  variant="secondary"
                  className="rounded-full font-normal text-muted-foreground"
                >
                  {tag}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="mdx-body mt-10">
        <MDXContent code={post.body} />
      </div>

      <footer className="mt-16 border-t border-border pt-6">
        <Link
          href="/blog"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "group -ml-2 text-muted-foreground",
          )}
        >
          <ArrowLeft className="transition-transform duration-300 group-hover:-translate-x-0.5" />
          回到文章列表
        </Link>
      </footer>
    </article>
  );
}
