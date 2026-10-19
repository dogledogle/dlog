"use client";

import { useEffect, useState } from "react";

type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

// GitHub 经典绿色梯度，暗色用官方暗色板；0 级交给 bg-muted 适配主题。
const levelClass = [
  "bg-muted",
  "bg-[#9be9a8] dark:bg-[#0e4429]",
  "bg-[#40c463] dark:bg-[#006d32]",
  "bg-[#30a14e] dark:bg-[#26a641]",
  "bg-[#216e39] dark:bg-[#39d353]",
];

// 列模板：53 周，窄屏每列不小于 8px（配合外层横向滚动），宽屏按 1fr 均分铺满。
const GRID_COLS = "grid-cols-[repeat(53,minmax(8px,1fr))]";

// 参考站同款元素：GitHub 贡献热力图。数据来自公开 API，
// 拉取失败时显示一整块空格子占位，保持版式稳定。
export function GithubHeatmap({ username }: { username: string }) {
  const [days, setDays] = useState<Day[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<{ contributions: Day[] }>;
      })
      .then((data) => {
        if (alive) setDays(data.contributions);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [username]);

  // 日子按自然周分列（GitHub 日历式，周日开头），一周一列共 7 行。
  const weeks: (Day | null)[][] = [];
  if (days && days.length > 0) {
    const firstDow = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
    let week: (Day | null)[] = Array.from({ length: firstDow }, () => null);
    for (const day of days) {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
  }

  // 月份标签：某列首个有效日子落在月初（≤7 号）且该月还没标过 → 标在列顶。
  const monthLabels = new Map<number, string>();
  if (weeks.length > 0) {
    const fmt = new Intl.DateTimeFormat("zh-CN", {
      month: "short",
      timeZone: "UTC",
    });
    let lastMonth = -1;
    weeks.forEach((week, index) => {
      const first = week.find(Boolean);
      if (!first) return;
      const d = new Date(`${first.date}T00:00:00Z`);
      if (d.getUTCDate() > 7 || d.getUTCMonth() === lastMonth) return;
      lastMonth = d.getUTCMonth();
      monthLabels.set(index, fmt.format(d));
    });
  }

  const total = days?.reduce((sum, day) => sum + day.count, 0) ?? 0;

  // 表头按列跨度分段：标签文字横跨多列，起点对齐所在列。
  const labelEntries = [...monthLabels.entries()];
  const headCells: { start: number; span: number; label?: string }[] = [];
  let cursor = 0;
  labelEntries.forEach(([index, label], i) => {
    const next = i + 1 < labelEntries.length ? labelEntries[i + 1][0] : weeks.length;
    if (index > cursor) headCells.push({ start: cursor, span: index - cursor });
    headCells.push({ start: index, span: next - index, label });
    cursor = next;
  });
  if (cursor < weeks.length) {
    headCells.push({ start: cursor, span: weeks.length - cursor });
  }

  return (
    <figure className="overflow-hidden rounded-xl border border-border px-3 py-3 sm:px-4">
      <figcaption className="sr-only">GitHub 贡献热力图</figcaption>
      {failed ? (
        <div>
          <div
            aria-hidden
            className={`grid grid-flow-col grid-rows-[repeat(7,auto)] items-start gap-[3px] ${GRID_COLS}`}
          >
            {Array.from({ length: 53 * 7 }).map((_, i) => (
              <span key={i} className="aspect-square w-full rounded-[2px] bg-muted" />
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-foreground/70">
            GitHub 贡献数据暂不可用
          </p>
        </div>
      ) : !days ? (
        <div
          role="status"
          className="flex min-h-[125px] items-center justify-center text-sm text-foreground/70"
        >
          正在加载 GitHub 贡献…
        </div>
      ) : (
        <>
          <div className="overflow-x-auto pb-1">
            {/* 月份标签行：与格子共用同一列模板，按列跨度对齐 */}
            <div
              className={`grid h-4 gap-[3px] text-left text-[10px] leading-4 text-foreground/70 ${GRID_COLS}`}
            >
              {headCells
                .filter((cell) => cell.label)
                .map((cell) => (
                  <div
                    key={cell.start}
                    style={{ gridColumn: `${cell.start + 1} / span ${cell.span}` }}
                  >
                    {cell.label}
                  </div>
                ))}
            </div>
            <div
              className={`grid grid-flow-col grid-rows-[repeat(7,auto)] items-start gap-[3px] ${GRID_COLS}`}
            >
              {weeks.flat().map((day, i) =>
                day ? (
                  <abbr
                    key={i}
                    title={`${day.date}：${day.count} 次提交`}
                    className={`block aspect-square w-full rounded-[2px] no-underline ${levelClass[day.level]}`}
                  />
                ) : (
                  <span key={i} className="block aspect-square w-full rounded-[2px]" />
                ),
              )}
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between px-1 text-xs text-foreground/70">
            <span>过去一年 {total} 次提交</span>
            <span className="flex items-center gap-1">
              少
              {levelClass.map((cls) => (
                <span key={cls} className={`size-2 rounded-[2px] ${cls}`} />
              ))}
              多
            </span>
          </div>
        </>
      )}
    </figure>
  );
}
