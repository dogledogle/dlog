import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-32 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-500">
      <p className="text-7xl font-bold tracking-tighter">404</p>
      <h1 className="mt-4 text-xl font-semibold">页面不存在</h1>
      <p className="mt-2 text-muted-foreground">
        地址可能输错了，或者内容已被移动。
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        ← 回到首页
      </Link>
    </div>
  );
}
