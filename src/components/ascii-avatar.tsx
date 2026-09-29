import type { CSSProperties } from "react";
import { asciiAvatar, type AsciiRun } from "./ascii-avatar-data";
import { asciiAvatarLight } from "./ascii-avatar-data-light";

// 几何参数需与 scripts/generate-ascii-avatar.mjs 顶部保持一致（fontSize 12 → 步进 7.2、行高 9.6）。
// COLS×ADV = ROWS×LH，网格为正方形，SVG 铺满正方形窗格（240×240）。
const ART = { cols: 40, rows: 30, adv: 7.2, lh: 9.6, fontSize: 12 };

// 淡入延迟的散布总时长：最晚的色块在 1.5s 时开始浮现。
const SCATTER_MS = 1500;

// 由网格坐标散列出 0..SCATTER_MS 的确定性伪随机延迟：各位置的色块随机浮现，
// 同一坐标每次算得一致，SSR 与客户端渲染结果相同，不产生 hydration 抖动。
function scatterDelay(x: number, y: number) {
  let h = (Math.imul(x + 1, 374761393) + Math.imul(y + 1, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  // ^ 的结果是有符号 32 位数,先 >>> 0 归一,避免取模后出现负延迟
  return ((h ^ (h >>> 16)) >>> 0) % SCATTER_MS;
}

// 每个色块用 x/y 精确定位，不依赖各平台等宽字体的字宽。
// 显现动画：色块在各自延迟后从无到有淡入，keyframes 见 globals.css。
function AvatarSvg({ rows, className }: { rows: AsciiRun[][]; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${ART.cols * ART.adv} ${ART.rows * ART.lh}`}
      className={className}
    >
      {rows.map((runs, y) => (
        <text
          key={y}
          xmlSpace="preserve"
          fontSize={ART.fontSize}
          className="ascii-avatar-row"
        >
          {runs.map((run) => (
            <tspan
              key={run.x}
              x={run.x * ART.adv}
              y={y * ART.lh + ART.fontSize * 0.76}
              fill={run.c}
              style={{ "--d": `${scatterDelay(run.x, y)}ms` } as CSSProperties}
            >
              {run.t}
            </tspan>
          ))}
        </text>
      ))}
    </svg>
  );
}

// ASCII 头像：彩色字符画。深色是暗底亮字（全图绘制，冻结的定稿数据）；
// 浅色是白底墨字（只画主体，字符密度反相、墨色压暗，见 ascii-avatar-data-light.ts）。
// 两套排布不同，各渲染一份 SVG，按 .dark 切换显示。
export function AsciiAvatar() {
  return (
    <>
      <AvatarSvg
        rows={asciiAvatar}
        className="hidden h-auto w-full font-mono dark:block"
      />
      <AvatarSvg
        rows={asciiAvatarLight}
        className="block h-auto w-full font-mono dark:hidden"
      />
    </>
  );
}
