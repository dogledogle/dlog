"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { AsciiAvatar } from "./ascii-avatar";
import {
  MagnifierName,
  usePrefersReducedMotion,
} from "./magnifier-name";

type Line = {
  kind: "cmd" | "out";
  text: string;
  accent?: boolean;
  pause?: number;
  magnify?: boolean;
};

const script: Line[] = [
  { kind: "cmd", text: "whoami" },
  { kind: "out", text: "多格 · 前端开发者", magnify: true },
  { kind: "cmd", text: "ls" },
  { kind: "out", text: "文章/ 随笔/ 笔记/ 诗/ 小玩意/" },
  { kind: "cmd", text: "dlog --status" },
  { kind: "out", text: "online · 欢迎常来", accent: true },
];

const cursor = (
  <span className="ml-0.5 inline-block h-3.5 w-[7px] animate-pulse bg-foreground align-[-2px]" />
);

// 数字滚动：从 0 缓出滚到目标值；reduced-motion 时直接显示目标值。
function useCountUp(target: number, runId: number, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let start: number | null = null;
    const timer = setTimeout(() => {
      const step = (t: number) => {
        if (start === null) start = t;
        const p = Math.min((t - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(eased * target));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [reduced, target, runId, duration, delay]);

  return reduced ? target : value;
}

export type StatusStat = { label: string; value: number; unit: string };

// 单行统计：数字滚动拆到独立组件，每行各持一份 useCountUp。
function StatusRow({ stat, runId }: { stat: StatusStat; runId: number }) {
  const value = useCountUp(stat.value, runId);
  return (
    <p className="flex items-center justify-between">
      <span className="text-muted-foreground">{stat.label}</span>
      <span className="tabular-nums text-foreground">{value} {stat.unit}</span>
    </p>
  );
}

// 会逐行打字的终端（tmux 三窗格：左侧剧本，中间 ASCII 头像，右侧状态面板）。
// 点右上角的重播按钮可以再来一遍；系统开启「减弱动态效果」时直接显示全部内容。
export function TerminalIntro({ stats }: { stats: StatusStat[] }) {
  const [current, setCurrent] = useState(-1);
  const [typed, setTyped] = useState(0);
  const [finished, setFinished] = useState(false);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const run = async () => {
      setCurrent(-1);
      setTyped(0);
      setFinished(false);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setCurrent(script.length);
        setFinished(true);
        return;
      }

      await sleep(500);
      for (let i = 0; i < script.length; i++) {
        if (cancelled) return;
        setCurrent(i);
        const line = script[i];
        if (line.kind === "cmd") {
          for (let c = 1; c <= line.text.length; c++) {
            if (cancelled) return;
            setTyped(c);
            await sleep(60);
          }
          await sleep(240);
        } else {
          setTyped(0);
          await sleep(line.pause ?? 380);
        }
      }
      if (!cancelled) setFinished(true);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [runId]);

  const revealed = finished ? script.length : current + 1;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
      <div className="flex items-center border-b border-border px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-green-400/70" />
        </span>
        <span className="ml-3 font-mono text-xs text-muted-foreground">dogle@dlog: ~</span>
        <button
          type="button"
          aria-label="重播动画"
          title="重播"
          onClick={() => setRunId((id) => id + 1)}
          className="ml-auto rounded-md p-1 text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      <div
        aria-hidden
        className="flex h-[240px] overflow-hidden font-mono text-[13px] leading-6"
      >
        {/* 左窗格：打字剧本 */}
        <div className="min-w-0 flex-1 space-y-1.5 px-4 py-4">
          {script.slice(0, revealed).map((line, i) => {
            const isTyping = !finished && i === current && line.kind === "cmd";
            const text = isTyping ? line.text.slice(0, typed) : line.text;
            return (
              <p key={i}>
                {line.kind === "cmd" ? (
                  <>
                    <span className="mr-2 text-emerald-600 dark:text-emerald-400">$</span>
                    <span className="text-foreground">{text}</span>
                    {isTyping && cursor}
                  </>
                ) : line.magnify ? (
                  <MagnifierName
                    className={
                      line.accent
                        ? "text-emerald-600 dark:text-emerald-300"
                        : "text-muted-foreground"
                    }
                    line={line.text}
                    name="多格"
                    reveal="刘东"
                  />
                ) : (
                  <span className={line.accent ? "text-emerald-600 dark:text-emerald-300" : "text-muted-foreground"}>
                    {text}
                  </span>
                )}
              </p>
            );
          })}
          {!finished && current === -1 && (
            <p>
              <span className="mr-2 text-emerald-600 dark:text-emerald-400">$</span>
              {cursor}
            </p>
          )}
          {finished && (
            <p>
              <span className="mr-2 text-emerald-600 dark:text-emerald-400">$</span>
              {cursor}
            </p>
          )}
        </div>

        {/* 中窗格：状态面板（小屏隐藏），统计与七巧板五个板块一一对应。 */}
        <div className="hidden w-60 shrink-0 border-l border-border px-4 py-4 sm:block">
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-700 motion-safe:fill-mode-both">
            <p className="text-xs text-muted-foreground">dlog@status</p>
            <div className="mt-3 space-y-2">
              {stats.map((stat) => (
                <StatusRow key={stat.label} stat={stat} runId={runId} />
              ))}
            </div>
          </div>
        </div>

        {/* 右窗格：ASCII 头像（数据由 scripts/generate-ascii-avatar.mjs 生成），
            宽度与终端体同高构成正方形，字符画铺满，小屏隐藏；
            key=runId 让重播时字符画也重新随机浮现一遍 */}
        <div className="hidden w-[240px] shrink-0 border-l border-border md:block">
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:fill-mode-both">
            <AsciiAvatar key={runId} />
          </div>
        </div>
      </div>
    </div>
  );
}
