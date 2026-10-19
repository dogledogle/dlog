"use client";

import { useEffect, useRef } from "react";

/*
 * 全站动态背景的萤火层（容器样式见 globals.css 的 .background-fx）：
 * Canvas 逐帧渲染，位置/大小/明灭峰值/方向/速度全部运行期随机且持续漂移，
 * 没有构建期定死的轨迹；颜色取自 --foreground，明暗主题自动适配。
 * 系统开启「减弱动态效果」时只画一帧静止微光。
 */

type Firefly = {
  x: number;
  y: number;
  heading: number; // 朝向（rad），随机游走
  speed: number; // px/s，随机游走
  turnRate: number; // 转向扰动强度（rad/s）
  r0: number; // 基础半径（px）
  period: number; // 明灭周期（s）
  phase: number; // 明灭相位（0–1）
  pk: number; // 明灭峰值不透明度，随时间缓慢漂移
  pkBase: number;
};

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) =>
  Math.min(b, Math.max(a, v));

function makeFirefly(w: number, h: number): Firefly {
  const pk = rnd(0.45, 0.85);
  return {
    x: rnd(0, w),
    y: rnd(0, h),
    heading: rnd(0, Math.PI * 2),
    speed: rnd(3, 14),
    turnRate: rnd(0.4, 2.2),
    r0: rnd(0.8, 1.5),
    period: rnd(7, 18),
    phase: rnd(0, 1),
    pk,
    pkBase: pk,
  };
}

/* 用当前前景色烘一枚径向渐变光斑贴图，逐帧 drawImage 复用 */
function makeSprite(color: string): HTMLCanvasElement | null {
  const probe = document.createElement("canvas");
  probe.width = probe.height = 1;
  const pctx = probe.getContext("2d");
  if (!pctx) return null;
  pctx.fillStyle = color;
  pctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = pctx.getImageData(0, 0, 1, 1).data;
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 64;
  const ctx = sprite.getContext("2d");
  if (!ctx) return null;
  const halo = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  halo.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
  halo.addColorStop(0.18, `rgba(${r}, ${g}, ${b}, 0.9)`);
  halo.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.26)`);
  halo.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, 64, 64);
  return sprite;
}

function readForegroundColor(): string {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--foreground")
      .trim() || "#888"
  );
}

export function BackgroundFX() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let fireflies: Firefly[] = [];
    let sprite = makeSprite(readForegroundColor());
    let raf = 0;
    let last = performance.now();

    const spawn = () => {
      // 数量随视口面积伸缩，个体参数全部运行期随机
      const count = Math.round(clamp((w * h) / 26000, 24, 56));
      fireflies = Array.from({ length: count }, () => makeFirefly(w, h));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawn();
    };
    resize();
    window.addEventListener("resize", resize);

    // 跟随主题切换换色（next-themes 切的是 html 的 class）
    const observer = new MutationObserver(() => {
      sprite = makeSprite(readForegroundColor());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const drawStatic = () => {
      ctx.clearRect(0, 0, w, h);
      if (!sprite) return;
      ctx.globalAlpha = 0.22;
      for (const f of fireflies) {
        const d = f.r0 * 6;
        ctx.drawImage(sprite, f.x - d / 2, f.y - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
    };

    const step = (now: number) => {
      const dt = clamp((now - last) / 1000, 0, 0.05);
      last = now;
      ctx.clearRect(0, 0, w, h);
      if (sprite) {
        const margin = 48;
        for (const f of fireflies) {
          // 朝向与速度都是随机游走：方向、快慢持续变化
          f.heading += (Math.random() - 0.5) * 2 * f.turnRate * dt;
          f.speed = clamp(f.speed + (Math.random() - 0.5) * 10 * dt, 1.5, 18);
          f.x += Math.cos(f.heading) * f.speed * dt;
          f.y += Math.sin(f.heading) * f.speed * dt;
          // 靠近边缘时轻推回视口，避免光点在界外突然消失
          const push = 120 * dt;
          if (f.x < margin) f.x += push * ((margin - f.x) / margin);
          if (f.x > w - margin)
            f.x -= push * ((f.x - (w - margin)) / margin);
          if (f.y < margin) f.y += push * ((margin - f.y) / margin);
          if (f.y > h - margin)
            f.y -= push * ((f.y - (h - margin)) / margin);
          // 明灭峰值自身也在缓慢漂移
          f.pk = clamp(
            f.pk +
              (Math.random() - 0.5) * 0.12 * dt +
              (f.pkBase - f.pk) * 0.05 * dt,
            0.25,
            0.95
          );
          f.phase = (f.phase + dt / f.period) % 1;
          const wave = Math.max(0, Math.sin(f.phase * Math.PI * 2)) ** 1.8;
          if (wave <= 0) continue;
          const r = f.r0 * (0.8 + 0.45 * wave);
          const d = r * 6;
          ctx.globalAlpha = f.pk * wave;
          ctx.drawImage(sprite, f.x - d / 2, f.y - d / 2, d, d);
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(step);
    };

    if (reduced.matches) {
      drawStatic();
    } else {
      raf = requestAnimationFrame(step);
    }
    const onReducedChange = () => {
      cancelAnimationFrame(raf);
      if (reduced.matches) {
        drawStatic();
      } else {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };
    reduced.addEventListener("change", onReducedChange);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      reduced.removeEventListener("change", onReducedChange);
      observer.disconnect();
    };
  }, []);

  return (
    <div aria-hidden className="background-fx">
      <span className="background-blob background-blob-a" />
      <span className="background-blob background-blob-b" />
      <canvas ref={canvasRef} className="background-fireflies" />
    </div>
  );
}
