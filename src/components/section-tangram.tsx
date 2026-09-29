"use client";

import {
  BookOpen,
  Feather,
  FileText,
  FlaskConical,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Section = {
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  /** 多边形顶点（viewBox 0 0 100 40，已验证五块无缝拼合） */
  points: string;
  /** 图标 + 文字水平组合的起点（x, 文字基线 y） */
  lockup: { x: number; y: number };
  /** hover 擦入的版块专属色：五块互不相同，相邻块也不是邻近色 */
  wipe: string;
  /** 拼装入场：起始 transform（px 在 SVG 里等于 viewBox 用户单位）、错峰
   * delay，以及文字淡入延迟（对齐该块落位时刻） */
  enter: { transform: string; delay: string; labelDelay: string };
  /** 闲置呼吸的松动方向与幅度（px 同上） */
  nudge: { x: string; y: string; tilt: string };
  ready: boolean;
};

/** 一次点击涟漪：点击点与覆盖半径（viewBox 坐标）、所在版块、重放用的自增 key */
type Ripple = { href: string; x: number; y: number; r: number; key: number };

/**
 * 页面加载时是否播放色块冲刷演示（tangram-demo：整幅色块顺擦入方向冲刷一
 * 遍）。只控制这一个加载演示，拼装飞入与文字淡入不受影响；false 时加载后
 * 色块保持静息，只保留交互动效（hover 擦入、点击涟漪、闲置呼吸）。
 */
const PLAY_WIPE_DEMO = false;

// 版块底色与墨色：底色与终端窗口同用 card 主题色（浅色即纯白、深色是
// token 的暗灰而非纯黑），其上的图标 / 文字 / 涟漪用 dark: 变体配纯色墨
// （浅色深墨、深色白墨），明暗主题下对比一致。hover 擦入的色块铺满
// 版块（五种擦入色都是亮色），图标与文字统一翻成 neutral-950，与底色无关。
const pieceStyles = {
  bg: "fill-card",
  icon: "text-neutral-500 dark:text-neutral-400",
  ink: "fill-neutral-950 dark:fill-white",
  inkMuted: "fill-neutral-500 dark:fill-neutral-400",
  ripple: "fill-neutral-950 dark:fill-white",
};

// 七巧板剖分（候选一，viewBox 100×40）：文章 31% / 笔记 21% / 诗 18% / 随笔 18% / 实验室 12%
// enter 的位移方向即各块背离拼图中心的朝向：飞入时像从画框外滑回原位；
// delay 按笔记 → 诗 → 文章 → 随笔 → 实验室错峰，中间的实验室最后落位压轴。
const sections: Section[] = [
  {
    title: "文章",
    desc: "技术、思考与长文",
    href: "/blog",
    icon: FileText,
    points: "100,14.67 100,40 40,40 52,18.67",
    lockup: { x: 70.35, y: 29 },
    wipe: "fill-sky-400",
    enter: { transform: "translate(9px, 3px) rotate(6deg)", delay: "0.16s", labelDelay: "1.22s" },
    nudge: { x: "0.8px", y: "0.3px", tilt: "1deg" },
    ready: true,
  },
  {
    title: "随笔",
    desc: "即时的想法与生活片段",
    href: "/essays",
    icon: Feather,
    points: "60,0 100,0 100,14.67 52,18.67",
    lockup: { x: 75.35, y: 9 },
    wipe: "fill-amber-400",
    enter: { transform: "translate(9px, -3px) rotate(-5deg)", delay: "0.24s", labelDelay: "1.38s" },
    nudge: { x: "0.8px", y: "-0.3px", tilt: "-0.9deg" },
    ready: true,
  },
  {
    title: "笔记",
    desc: "碎片化的知识卡片",
    href: "/notes",
    icon: NotebookPen,
    points: "0,24 52,18.67 40,40 0,40",
    lockup: { x: 20.35, y: 30.5 },
    wipe: "fill-rose-400",
    enter: { transform: "translate(-9px, 3px) rotate(-6deg)", delay: "0s", labelDelay: "0.9s" },
    nudge: { x: "-0.8px", y: "0.3px", tilt: "-1deg" },
    ready: true,
  },
  {
    title: "诗",
    desc: "如果能称作诗的话",
    href: "/poems",
    icon: BookOpen,
    points: "0,0 60,0 0,24",
    lockup: { x: 16.7, y: 8.5 },
    wipe: "fill-violet-400",
    enter: { transform: "translate(-8px, -4px) rotate(5deg)", delay: "0.08s", labelDelay: "1.06s" },
    nudge: { x: "-0.7px", y: "-0.4px", tilt: "0.9deg" },
    ready: true,
  },
  {
    title: "实验室",
    desc: "开源作品与小工具",
    href: "/lab",
    icon: FlaskConical,
    points: "0,24 60,0 52,18.67",
    lockup: { x: 36.7, y: 14.8 },
    wipe: "fill-emerald-400",
    enter: { transform: "translate(0px, -8px) rotate(7deg)", delay: "0.32s", labelDelay: "1.54s" },
    nudge: { x: "0px", y: "-0.9px", tilt: "1.2deg" },
    ready: true,
  },
];

// 七巧板导航：hover / 点击只在多边形内部生效（SVG 原生几何命中，无需手写数学）。
// hover 变色是色块在版块内自左向右擦入（机制见 PieceLayers 注释）；每块擦入
// 专属的鲜艳色（section.wipe），静息时每块铺同色底（与终端窗口同为 card
// 色，见 pieceStyles），悬停时图标与文字同步翻成深色墨保证可读，
// 建设中块靠组内 opacity-60 自然降饱和以示未完成。每块描边与终端边框同色
// （border-border）；通栏容器 rounded-xl + overflow-hidden 裁出与终端一致的
// 四个圆角；小屏（<640px）退化为卡片列表。
// 动效（keyframes 与 reduced-motion 降级都在 globals.css）：加载时每块沿
// section.enter 的朝向从画框外飞入错峰拼合（tangram-assemble，SVG 视口裁掉
// 框外部分，像从画框下滑进来），文字在该块落位时原地淡入（enter.labelDelay）；
// 页面闲置数秒后随机一块沿 section.nudge 松动一下提醒可点（tangram-idle /
// tangram-idle-lockup，触发逻辑见 SectionTangram）；按下时自点击点扩散一圈
// 涟漪（tangram-ripple，与擦入色块同被版块 clipPath 裁剪，见 startRipple）；
// 页面加载后整幅色块随即顺擦入方向冲刷而过，与拼装同时进行、无延迟
// （svg 上的 tangram-demo 类，见 globals.css，摘类挂在末层动画播完的
// animationEnd 上；是否起跑由 PLAY_WIPE_DEMO 控制，默认关闭）。
// 带位移/旋转的动画只作用于形状层、文字只淡入或平移，避免动画重采样把文字
// 糊掉（见 PieceMotion 注释）；形状与文字各自嵌套内层 g 挂闲置动画，移除
// idle 类回退时不会把已播完的入场动画重新触发一遍。
// 版块内部图层（ready / 建设中共用）：透明命中层（无视觉，只接事件）→
// 底色（与终端窗口同为 card 色，见 pieceStyles）→ 擦入色块（同色三连
// 块，透明度 30% / 60% / 100% 渐深）→ 描边。其上图标与文字也用 dark: 变体
// 配纯色墨（浅色深墨、深色白墨）保证
// 明暗主题下都可读；色块默认 translateX(-101%) 藏于自身包围盒
// 左侧（transform-box: fill-box 让百分比相对自身而非 viewBox）。hover 擦入
// 是 globals.css 里 tangram-wipe-relay 的接力编排，挂在 JS 加的
// tangram-wipe-play 类上（onMouseEnter / onFocus 置 active 即挂上，见
// showSection）：每块减速滑到半程后以匀速慢速蠕行越过半程「等待」后块
// （全程无零速），再顺着蠕行速度加速滑到终点；静态终点态 translateX(0)
// 也由该类提供（原 group-hover 工具类已并入）。移出由 exiting 时的
// tangram-wipe-out 动画驱动：三层按进站相反的顺序（深 → 中 → 浅，错峰
// 180ms）依次滑回 -101%，from 帧取移出瞬间趁 relay 未摘抓取的各层当前
// 位置（--wipe-out-from，见 captureWipeFrom），滑入中途移出也从当前位置
// 滑出、不先跳回终点（详见 globals.css，transition 不参与——Chrome 不从
// 被移除动画的填充值起过渡）；ref 登记三层元素供抓取。
// clipPath 用版块自身多边形裁剪，滑出部分不越界到邻块；描边单独置顶，
// 避免被色块盖住。
function PieceLayers({
  section,
  dashed = false,
  ripple,
  onRippleEnd,
  onWipeDemoEnd,
  exiting,
  onWipeLayer,
}: {
  section: Section;
  dashed?: boolean;
  ripple?: Ripple | null;
  onRippleEnd?: () => void;
  onWipeDemoEnd?: () => void;
  exiting?: boolean;
  onWipeLayer?: (index: number, el: SVGPolygonElement | null) => void;
}) {
  const clipId = `tangram-clip-${section.href.replace("/", "")}`;
  return (
    <>
      <clipPath id={clipId}>
        <polygon points={section.points} />
      </clipPath>
      {/* 透明命中层：接收 hover / 点击的实心层（fill-transparent 仍可命中，
          fill-none 则不行），本身无视觉 */}
      <polygon points={section.points} className="fill-transparent" />
      {/* 版块底色：与终端窗口同用 card 色，静息铺满版块；擦入色块、
          涟漪都盖在其上，hover 后整块被擦入色覆盖 */}
      <polygon points={section.points} className={pieceStyles.bg} />
      <g clipPath={`url(#${clipId})`}>
        {/* 三层擦入色块：同色、透明度渐深。hover 擦入走 globals.css 的
            tangram-wipe-relay 接力编排；移出由 exiting 时的 tangram-wipe-out
            动画驱动——Chrome 不会从被移除动画的填充值起 transition（实测
            transitionrun 不触发），划出也必须用动画：按进站相反的顺序
            （深 → 中 → 浅）错峰 180ms 依次滑回 -101%，from 帧取移出瞬间
            抓取的当前位置（--wipe-out-from，见 captureWipeFrom），滑入
            中途移出不先跳回终点。ref 把三层元素登记给 SectionTangram 抓取 */}
        <polygon
          points={section.points}
          ref={(el) => {
            onWipeLayer?.(0, el);
          }}
          className={cn(
            `${section.wipe} opacity-30 tangram-wipe-in-1 [transform:translateX(-101%)] [transform-box:fill-box]`,
            exiting && "tangram-wipe-out-1",
          )}
        />
        <polygon
          points={section.points}
          ref={(el) => {
            onWipeLayer?.(1, el);
          }}
          className={cn(
            `${section.wipe} opacity-60 tangram-wipe-in-2 [transform:translateX(-101%)] [transform-box:fill-box]`,
            exiting && "tangram-wipe-out-2",
          )}
        />
        <polygon
          points={section.points}
          ref={(el) => {
            onWipeLayer?.(2, el);
          }}
          className={cn(
            `${section.wipe} tangram-wipe-in-3 [transform:translateX(-101%)] [transform-box:fill-box]`,
            exiting && "tangram-wipe-out-3",
          )}
          onAnimationEnd={onWipeDemoEnd}
        />
        {/* 点击涟漪：与擦入色块同组，一起被版块多边形裁剪，不会越界到邻块 */}
        {ripple && (
          <circle
            key={ripple.key}
            cx={ripple.x}
            cy={ripple.y}
            r={ripple.r}
            // 涟漪取与底色相反的墨色（浅色深圈、深色白圈）才可见
            className={cn("tangram-ripple", pieceStyles.ripple)}
            onAnimationEnd={onRippleEnd}
          />
        )}
      </g>
      <polygon
        points={section.points}
        className="fill-none stroke-border"
        strokeWidth={1}
        strokeDasharray={dashed ? "2 1.2" : undefined}
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}

// 动效分层：带位移/旋转的动画只作用于多边形形状层。合成器会把动画中的组
// 栅格化后逐帧重采样，文字（旋转时尤甚）会发虚，所以文字层入场改为在落点
// 原地淡入、闲置松动时只平移跟随（形状 ≤1.2° 的微倾与文字的相对偏差不可
// 感知）。形状与文字各自嵌套内层 g 挂闲置动画：移除 idle 类回退时不会把
// 已播完的入场动画重新触发一遍。
function PieceMotion({
  section,
  dashed = false,
  wobbling,
  ripple,
  onRippleEnd,
  onWipeDemoEnd,
  exiting,
  onWipeLayer,
  children,
}: {
  section: Section;
  dashed?: boolean;
  wobbling: boolean;
  ripple?: Ripple | null;
  onRippleEnd?: () => void;
  onWipeDemoEnd?: () => void;
  exiting?: boolean;
  onWipeLayer?: (index: number, el: SVGPolygonElement | null) => void;
  children: ReactNode;
}) {
  const nudgeVars = {
    "--nudge-x": section.nudge.x,
    "--nudge-y": section.nudge.y,
  } as CSSProperties;
  return (
    <>
      {/* 形状层：拼装（位移+旋转）与闲置松动（位移+微倾） */}
      <g
        className="tangram-assemble"
        style={
          {
            "--enter": section.enter.transform,
            animationDelay: section.enter.delay,
          } as CSSProperties
        }
      >
        <g
          className={cn(wobbling && "tangram-idle")}
          style={
            { ...nudgeVars, "--tilt": section.nudge.tilt } as CSSProperties
          }
        >
          <PieceLayers
            section={section}
            dashed={dashed}
            ripple={ripple}
            onRippleEnd={onRippleEnd}
            onWipeDemoEnd={onWipeDemoEnd}
            exiting={exiting}
            onWipeLayer={onWipeLayer}
          />
        </g>
      </g>
      {/* 文字层：入场在落点淡入（delay 对齐该块落位），闲置只跟随平移 */}
      <g
        className="tangram-lockup"
        style={{ animationDelay: section.enter.labelDelay } as CSSProperties}
      >
        <g className={cn(wobbling && "tangram-idle-lockup")} style={nudgeVars}>
          {children}
        </g>
      </g>
    </>
  );
}

// 加载色块演示：页面加载即把整幅色块顺擦入方向冲刷一遍（与拼装飞入同时
// 进行、不设延迟）——接力划入（与 hover 前三段逐帧一致）后到站不停，继续
// 滑出板块直至完全离开（出界段由版块 clipPath 裁掉），末帧在界外折返静息位
// -101%，animationEnd 摘类时样式零变化、不会触发 transition 回扫。悬停 /
// 聚焦即刻取消（见 showSection），把动效交还真实交互；减弱动效下不启动。

export function SectionTangram() {
  const [active, setActive] = useState<Section | null>(null);
  // displayed 保留最后悬停的版块：移出后 active 清空、文案淡出时才有内容可过渡
  const [displayed, setDisplayed] = useState<Section | null>(null);
  // 闲置呼吸：距上次任意输入超过 5s 时随机挑一块（不与上次重复）松动一下；
  // 触发时顺带刷新活跃时间戳，节奏自然固定在约 6s 一次。监听挂在 window 上、
  // 只写 ref 不触发渲染；标签页不可见时不触发。
  const [idlePiece, setIdlePiece] = useState<string | null>(null);
  const lastActiveRef = useRef(0);
  const lastWobbledRef = useRef<string | null>(null);

  // 移出划出（机制见 globals.css 的 .tangram-wipe-out 注释）：Chrome 不会
  // 从被移除动画的填充值起 transition，移出也用动画驱动——mouseleave 时给
  // 最后悬停的版块挂 700ms 划出类（三层反向错峰），播完自动摘类；期间悬停
  // 别的版块不打断进行中的划出（划出类的动画会被新 hover 的 relay 压过），
  // 只是换掉随后移出的那块。
  const [exiting, setExiting] = useState<string | null>(null);
  const exitTimerRef = useRef<number | undefined>(undefined);
  const showExit = (title: string) => {
    window.clearTimeout(exitTimerRef.current);
    setExiting(title);
    exitTimerRef.current = window.setTimeout(
      () => setExiting((cur) => (cur === title ? null : cur)),
      700,
    );
  };

  // 三层擦入色块的元素登记（PieceLayers 的 ref 回调写入），键为版块 title
  const wipeLayersRef = useRef(
    new Map<string, (SVGPolygonElement | null)[]>(),
  );
  const registerWipeLayer = (
    title: string,
    index: number,
    el: SVGPolygonElement | null,
  ) => {
    const layers = wipeLayersRef.current.get(title) ?? [];
    layers[index] = el;
    wipeLayersRef.current.set(title, layers);
  };

  // 抓取三层色块的当前位置（机制见 globals.css 的 .tangram-wipe-play 注释）：
  // relay 动画挂在 JS 维护的 tangram-wipe-play 类上，移出此刻类还没摘、
  // 动画未死，getComputedStyle 读到的正是各层当前的插值矩阵（滑入中）或
  // 终点 0（已滑完）；写进内联 --wipe-out-from 供 tangram-wipe-out 的
  // from 帧用——滑出从真实当前位置出发，不再先跳回终点再滑。必须在
  // setActive 摘类之前同步调用，摘类后再读就只能拿到静息位 -101%。
  const captureWipeFrom = (title: string) => {
    for (const el of wipeLayersRef.current.get(title) ?? []) {
      if (!el) continue;
      const matrix = getComputedStyle(el).transform;
      if (matrix && matrix !== "none")
        el.style.setProperty("--wipe-out-from", matrix);
    }
  };
  // 卸载时清掉划出类的定时器
  useEffect(() => () => window.clearTimeout(exitTimerRef.current), []);

  useEffect(() => {
    lastActiveRef.current = Date.now();
    const markActive = () => {
      lastActiveRef.current = Date.now();
    };
    const events = ["pointermove", "pointerdown", "keydown", "wheel"] as const;
    for (const event of events)
      window.addEventListener(event, markActive, { passive: true });

    let settleTimer: number | undefined;
    const timer = window.setInterval(() => {
      if (document.hidden || Date.now() - lastActiveRef.current < 5000) return;
      lastActiveRef.current = Date.now();
      const pool = sections.filter((s) => s.title !== lastWobbledRef.current);
      const piece = pool[Math.floor(Math.random() * pool.length)];
      lastWobbledRef.current = piece.title;
      setIdlePiece(piece.title);
      settleTimer = window.setTimeout(() => setIdlePiece(null), 1000);
    }, 1000);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(settleTimer);
      for (const event of events)
        window.removeEventListener(event, markActive);
    };
  }, []);

  // 加载色块演示（机制见上方模块注释）：水合完成且 PLAY_WIPE_DEMO 开启时
  // 即起跑、不设延迟；类进 DOM 的同一次提交里动画才开始存在，animationEnd
  // 必然发生在挂载之后、不会漏接（摘类逻辑见 PieceLayers 的 onWipeDemoEnd）。
  const [wipeDemo, setWipeDemo] = useState(false);
  useEffect(() => {
    if (!PLAY_WIPE_DEMO) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setWipeDemo(true);
  }, []);

  // 加载演示的摘类：任一块的末层冲出动画播完即整体撤下 tangram-demo。
  // 末帧已在界外折返静息位，摘类零样式变化；纯 hover 播完的 animationEnd
  // 不动它
  const onWipeDemoEnd = () => {
    if (wipeDemo) setWipeDemo(false);
  };

  // 点击涟漪：pointerdown 时把点击点换算成 viewBox 坐标（getScreenCTM 反变换，
  // 对动画中的各级 transform 也成立），在该版块的 clip 组内画一个自点击点扩散
  // 渐隐的圆；半径取点击点到版块最远顶点的距离，保证扫满全块。动画结束
  // （onAnimationEnd）即卸载；减弱动效下涟漪依赖动画消隐，直接不渲染。
  const [ripple, setRipple] = useState<Ripple | null>(null);
  const rippleKeyRef = useRef(0);
  const startRipple = (e: ReactPointerEvent<HTMLAnchorElement>, section: Section) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // React 的 JSX 类型把 SVG 里的 <a> 标成 HTMLAnchorElement，closest("svg")
    // 等价于 ownerSVGElement 且类型正确（运行时是 SVGAElement）
    const ctm = e.currentTarget.closest("svg")?.getScreenCTM();
    if (!ctm) return;
    const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      ctm.inverse(),
    );
    const nums = section.points.split(/[\s,]+/).map(Number);
    let r = 0;
    for (let i = 0; i < nums.length; i += 2)
      r = Math.max(r, Math.hypot(nums[i] - point.x, nums[i + 1] - point.y));
    rippleKeyRef.current += 1;
    setRipple({
      href: section.href,
      x: point.x,
      y: point.y,
      r,
      key: rippleKeyRef.current,
    });
  };

  const showSection = (section: Section | null) => {
    setActive(section);
    if (section) setDisplayed(section);
    // 悬停 / 聚焦即刻打断正在进行的闲置呼吸，避免与 hover 擦入叠加
    setIdlePiece(null);
    // 同时取消加载色块演示：被悬停的块切到 hover 的接力动画、自左重新
    // 擦入，其余块摘类后沿 transition 退回静息位
    setWipeDemo(false);
    // 移出（鼠标离开 / 键盘失焦）时先趁 relay 未摘类抓取最后悬停版块三层
    // 色块的当前位置，再挂反向错峰的划出类——划出从抓到的位置出发
    if (section === null && displayed) {
      captureWipeFrom(displayed.title);
      showExit(displayed.title);
    }
  };
  const setActiveHandlers = (section: Section) => ({
    onMouseEnter: () => showSection(section),
    onMouseLeave: () => showSection(null),
    onFocus: () => showSection(section),
    onBlur: () => showSection(null),
  });

  return (
    <div>
      {/* 中大屏：七巧板 */}
      <div className="hidden sm:block">
        <div className="overflow-hidden rounded-xl border border-border">
          <svg
            viewBox="0 0 100 40"
            aria-label="内容分区导航"
            className={cn("block h-auto w-full", wipeDemo && "tangram-demo")}
          >
            {sections.map((section) => {
              const Icon = section.icon;
              return section.ready ? (
                <a
                  key={section.title}
                  href={section.href}
                  aria-label={`${section.title} — ${section.desc}`}
                  // relay 挂 JS 类而非 :hover（globals.css .tangram-wipe-play）：
                  // active 即挂上，移出处理器先抓位置再摘类划出
                  className={cn(
                    "group block cursor-pointer outline-none",
                    active === section && "tangram-wipe-play",
                  )}
                  tabIndex={0}
                  onPointerDown={(e) => startRipple(e, section)}
                  {...setActiveHandlers(section)}
                >
                  <PieceMotion
                    section={section}
                    wobbling={idlePiece === section.title}
                    ripple={ripple?.href === section.href ? ripple : null}
                    onRippleEnd={() => setRipple(null)}
                    onWipeDemoEnd={onWipeDemoEnd}
                    exiting={exiting === section.title}
                    onWipeLayer={(index, el) =>
                      registerWipeLayer(section.title, index, el)
                    }
                  >
                    <Icon
                      x={section.lockup.x}
                      y={section.lockup.y - 1.55}
                      width={2}
                      height={2}
                      className={cn(
                        pieceStyles.icon,
                        "transition-colors duration-300 group-hover:text-neutral-950",
                      )}
                    />
                    <text
                      x={section.lockup.x + 2.7}
                      y={section.lockup.y}
                      textAnchor="start"
                      className={cn(
                        pieceStyles.ink,
                        "text-[1.3px] font-medium transition-colors duration-300 group-hover:fill-neutral-950",
                      )}
                    >
                      {section.title}
                    </text>
                  </PieceMotion>
                </a>
              ) : (
                <g
                  key={section.title}
                  aria-label={`${section.title}（建设中）`}
                  className={cn(
                    "group opacity-60",
                    active === section && "tangram-wipe-play",
                  )}
                  {...setActiveHandlers(section)}
                >
                  <PieceMotion
                    section={section}
                    dashed
                    wobbling={idlePiece === section.title}
                    onWipeDemoEnd={onWipeDemoEnd}
                    exiting={exiting === section.title}
                    onWipeLayer={(index, el) =>
                      registerWipeLayer(section.title, index, el)
                    }
                  >
                    <Icon
                      x={section.lockup.x}
                      y={section.lockup.y - 1.55}
                      width={2}
                      height={2}
                      className={cn(
                        pieceStyles.icon,
                        "transition-colors duration-300 group-hover:text-neutral-950",
                      )}
                    />
                    <text
                      x={section.lockup.x + 2.7}
                      y={section.lockup.y}
                      textAnchor="start"
                      className={cn(
                        pieceStyles.inkMuted,
                        "text-[1.3px] font-medium transition-colors duration-300 group-hover:fill-neutral-950",
                      )}
                    >
                      {section.title}
                    </text>
                  </PieceMotion>
                </g>
              );
            })}
          </svg>
        </div>
        {/* 标题动画拆两层：外层 p 常驻、用 opacity 过渡做显隐（含移出后的淡出）；
            内层 span 按版块 key 重挂载，切换版块时新文案从右侧滑入 */}
        <div className="mt-2 flex h-5 items-center justify-center">
          <p
            aria-hidden={!active}
            className={cn(
              "text-sm text-muted-foreground transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
              active ? "opacity-100" : "opacity-0",
            )}
          >
            {displayed && (
              <span
                key={displayed.title}
                className="inline-block animate-in slide-in-from-right-2 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none"
              >
                {displayed.desc}
                {displayed.ready ? "" : "（建设中）"}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 小屏：卡片列表 */}
      <div className="space-y-4 sm:hidden">
        {sections.map((section) => {
          const Icon = section.icon;
          const card = (
            <>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-md",
                    section.ready
                      ? "bg-primary text-primary-foreground"
                      : "border bg-muted/60 text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <h2 className="font-medium">{section.title}</h2>
                {!section.ready && (
                  <Badge
                    variant="secondary"
                    className="ml-auto font-normal text-muted-foreground"
                  >
                    建设中
                  </Badge>
                )}
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {section.desc}
              </p>
            </>
          );
          return section.ready ? (
            <Link
              key={section.title}
              href={section.href}
              className="block rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-accent/50"
            >
              {card}
            </Link>
          ) : (
            <div
              key={section.title}
              className="rounded-xl border border-dashed bg-card p-5 opacity-70"
            >
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
