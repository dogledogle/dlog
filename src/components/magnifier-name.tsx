"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

// 字号与行高必须和终端左窗格的 text-[13px] leading-6 保持一致。
// 镜内文字按 MAG 倍字号原生排版（放大后依然锐利），每帧只做平移对位：
// 把指针下的内容点拉到镜心，邻点随之拉开 MAG 倍，即真实放大。
const FONT = 13;
const LH = 24;
const MAG = 2.2; // 放大倍率
const LENS_D = 92; // 镜片直径
const LENS_R = LENS_D / 2;
// 触摸时镜心相对触点上抬的距离：半镜 46 + 指腹遮挡余量，让镜片底缘落在指尖上方
const TOUCH_LIFT = 72;

type Phase = "hidden" | "active" | "leaving";

/*
 * 「真名放大镜」：悬停整行文案里的 name（两个字）时，浮出一枚跟随
 * 指针的放大镜，镜片里是同一行文字的放大版，且 name 显形为 reveal。
 * - 镜体位置用 rAF + 指数平滑追赶指针，带一点水平速度带来的倾斜，
 *   跟手又有惯性感；portal 到 body，不被终端的 overflow 裁掉；
 * - 触摸时手指会挡住镜心，镜体整体抬到指尖上方（内容焦点仍对准
 *   触点，看到的还是指的那行字）；触摸点挪出「多格」或松手即退场，
 *   name 区禁掉触摸滚动；
 * - 根元素 inline-block，让 getBoundingClientRect 拿到整行盒
 *   （inline 元素的高度不含半行距，对位会差半个行距）；
 * - 系统开启「减弱动态效果」时：不做追赶与倾斜、进出场无过渡。
 */
export function MagnifierName({
  line,
  name,
  reveal,
  className,
}: {
  line: string;
  name: string;
  reveal: string;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>("hidden");
  // shown 只负责进出场时镜体的弹性缩放/淡入，与 rAF 驱动的位移分属两层；
  // reduced-motion 下不看 shown，出现即完整形态
  const [shown, setShown] = useState(false);
  const visible = reduced ? phase === "active" : shown;
  const lineRef = useRef<HTMLSpanElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const bigRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const tilt = useRef(0);
  const pointerType = useRef<"mouse" | "touch" | "pen">("mouse");
  const rect = useRef<DOMRect | null>(null);

  // 入场：挂载后隔两帧再展开，保证初始 scale-50 先被绘制、过渡能触发
  useEffect(() => {
    if (phase !== "active" || reduced) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [phase, reduced]);

  // 退场：等淡出过渡播完再卸载 portal
  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = setTimeout(() => setPhase("hidden"), reduced ? 0 : 280);
    return () => clearTimeout(timer);
  }, [phase, reduced]);

  // 追赶指针的主循环：位置指数平滑（时间补偿，掉帧也恒定手感），
  // 水平速度映射成 ±8° 的镜身倾斜，也做平滑，像被拖着的实体镜。
  useEffect(() => {
    if (phase === "hidden") return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(t - last, 64);
      last = t;
      const touch = pointerType.current === "touch";
      // 触摸时收紧平滑（跟指即跟手，滞后会显得「漂」），桌面保留惯性感
      const ease = reduced ? 1 : 1 - Math.exp(-dt / (touch ? 28 : 50));
      const prevX = pos.current.x;
      pos.current.x += (target.current.x - pos.current.x) * ease;
      pos.current.y += (target.current.y - pos.current.y) * ease;
      const vx = (pos.current.x - prevX) / Math.max(dt, 1);
      const tiltTarget = reduced ? 0 : Math.max(-8, Math.min(8, vx * 4));
      tilt.current +=
        (tiltTarget - tilt.current) * (reduced ? 1 : 1 - Math.exp(-dt / 100));

      const { x, y } = pos.current;
      if (lensRef.current) {
        // 触摸时镜体抬到指尖上方、钳在视口内；镜内焦点仍对准触点，
        // 所以镜片里看到的仍是手指按住的那行字
        const cy = touch ? Math.max(y - TOUCH_LIFT, LENS_R + 4) : y;
        lensRef.current.style.transform = `translate3d(${x - LENS_R}px, ${
          cy - LENS_R
        }px, 0) rotate(${tilt.current.toFixed(3)}deg)`;
      }
      // 镜内放大层对位：把指针下的内容拉到镜心（纯平移，字号已是 MAG 倍）
      const r = rect.current;
      if (bigRef.current && r) {
        const dx = LENS_R - MAG * (x - r.left);
        const dy = LENS_R - MAG * (y - r.top);
        bigRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reduced]);

  // 悬停期间页面滚动/窗口缩放会让整行盒跑位，监听并刷新
  useEffect(() => {
    if (phase === "hidden") return;
    const refresh = () => {
      rect.current = lineRef.current?.getBoundingClientRect() ?? null;
    };
    window.addEventListener("scroll", refresh, true);
    window.addEventListener("resize", refresh);
    return () => {
      window.removeEventListener("scroll", refresh, true);
      window.removeEventListener("resize", refresh);
    };
  }, [phase]);

  const deactivate = () => {
    setShown(false);
    setPhase("leaving");
  };

  const activate = (e: ReactPointerEvent<HTMLSpanElement>) => {
    pointerType.current = e.pointerType;
    rect.current = lineRef.current?.getBoundingClientRect() ?? null;
    target.current = { x: e.clientX, y: e.clientY };
    pos.current = { x: e.clientX, y: e.clientY };
    tilt.current = 0;
    setShown(false);
    setPhase("active");
  };

  const i = line.indexOf(name);
  const before = i >= 0 ? line.slice(0, i) : line;
  const after = i >= 0 ? line.slice(i + name.length) : "";

  // 整行禁选：拖动玩放大镜时不该带出选区，且框选复制会把 sr-only 的真名一起带走
  return (
    <span ref={lineRef} className={cn("inline-block select-none", className)}>
      {before}
      <span
        onPointerEnter={activate}
        onPointerMove={(e) => {
          pointerType.current = e.pointerType;
          target.current = { x: e.clientX, y: e.clientY };
          // 触摸隐式捕获下挪出「多格」不会自然触发 pointerLeave，手动判定退场
          if (e.pointerType === "touch") {
            const r = e.currentTarget.getBoundingClientRect();
            if (
              e.clientX < r.left ||
              e.clientX > r.right ||
              e.clientY < r.top ||
              e.clientY > r.bottom
            ) {
              deactivate();
            }
          }
        }}
        onPointerLeave={deactivate}
        onPointerUp={(e) => {
          // 触摸没有悬停态，松手即退场；鼠标点按不应打断 hover 中的放大镜
          if (e.pointerType !== "mouse") deactivate();
        }}
        onPointerCancel={deactivate}
        className="touch-none hover:cursor-none"
      >
        {name}
      </span>
      {after}
      <span className="sr-only">（真名：{reveal}）</span>
      {phase !== "hidden" &&
        createPortal(
          <div
            ref={lensRef}
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-[60] will-change-transform"
            style={{ width: LENS_D, height: LENS_D }}
          >
            <div
              className={cn(
                "relative size-full",
                !reduced &&
                  "transition-[transform,opacity] duration-250 ease-[cubic-bezier(.3,1.6,.4,1)]",
                visible ? "scale-100 opacity-100" : "scale-50 opacity-0",
              )}
            >
              {/* 镜片：圆形裁切 + 半透明玻璃底，罩住放大的整行文字。
                  阴影用 box-shadow 挂在镜圈上、不做 backdrop 模糊，
                  避免每帧跟随指针时反复走离屏滤镜造成掉帧 */}
              <div className="absolute inset-0 overflow-hidden rounded-full bg-card/80 shadow-[inset_0_0_14px_rgb(0_0_0/0.08)]">
                <div
                  ref={bigRef}
                  className="absolute left-0 top-0 whitespace-nowrap font-mono will-change-transform"
                  style={{ fontSize: FONT * MAG, lineHeight: `${LH * MAG}px` }}
                >
                  <span className="text-muted-foreground">{before}</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-300">
                    {reveal}
                  </span>
                  <span className="text-muted-foreground">{after}</span>
                </div>
                {/* 玻璃质感：斜向高光 */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/25 via-transparent to-white/10 dark:from-white/10 dark:to-white/5" />
                {!reduced && (
                  <div className="lens-glint absolute inset-0 overflow-hidden rounded-full" />
                )}
              </div>
              {/* 镜圈 */}
              <div className="absolute inset-0 rounded-full border-2 border-zinc-300 shadow-[0_10px_14px_rgb(0_0_0/0.22)] dark:border-zinc-600" />
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}
