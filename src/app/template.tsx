import type { ReactNode } from "react";

// template.tsx 在每次路由切换时重新挂载，给页面一个轻量的入场过渡。
export default function Template({ children }: { children: ReactNode }) {
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
      {children}
    </div>
  );
}
