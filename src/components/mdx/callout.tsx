import type { ReactNode } from "react";

const variants = {
  info: "border-accent/50 bg-accent/5",
  warn: "border-amber-500/60 bg-amber-500/5",
} as const;

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: keyof typeof variants;
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside
      className={`my-6 rounded-lg border-l-4 px-4 py-3 text-sm leading-7 ${variants[type]}`}
    >
      {title && <p className="mb-1 font-medium">{title}</p>}
      {children}
    </aside>
  );
}
