type EmptyStateProps = {
  title: string;
  className?: string;
};

// 全站通用的空状态：一只趴着打盹的极简线条猫 + 一行提醒。
// Zzz 逐个上浮、猫身轻微呼吸（见 globals.css，reduced-motion 时静止）；纯展示，无任何交互。
export function EmptyState({ title, className }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center ${className ?? ""}`}>
      <svg
        aria-hidden
        viewBox="0 0 240 160"
        className="w-48 text-muted-foreground/70"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 地面 */}
        <line x1={44} y1={138} x2={208} y2={138} strokeOpacity={0.35} />
        <g className="empty-cat">
          {/* 身体：从鼻尖起笔，经额头、双耳、圆背到臀部，沿地面收一个圆下巴 */}
          <path d="M64 120 Q62 106 70 98 L74 82 L86 92 Q94 88 102 86 L108 68 L118 84 Q154 72 178 94 Q198 112 190 138 L70 138 Q62 134 64 120 Z" />
          {/* 尾巴：从身后绕出的小卷 */}
          <path d="M186 130 Q210 126 204 104 Q200 90 184 94" />
          {/* 收在下巴底下的小前爪 */}
          <path d="M70 138 Q78 129 88 138" />
        </g>
        {/* 闭眼与猫嘴 */}
        <path d="M73 108 Q78 113 83 108" />
        <path d="M66 121 Q69 124 72 121 Q75 124 78 121" strokeWidth={2} />
        {/* 胡须 */}
        <g strokeWidth={1.75} strokeOpacity={0.6}>
          <path d="M62 113 L48 110" />
          <path d="M62 118 L49 120" />
        </g>
        {/* Zzz：字号递增，交错上浮 */}
        <g className="font-mono" stroke="none" fill="currentColor">
          <text x={44} y={62} fontSize={13} className="empty-zzz">
            z
          </text>
          <text
            x={62}
            y={46}
            fontSize={17}
            className="empty-zzz"
            style={{ animationDelay: "0.9s" }}
          >
            Z
          </text>
          <text
            x={84}
            y={30}
            fontSize={22}
            className="empty-zzz"
            style={{ animationDelay: "1.8s" }}
          >
            Z
          </text>
        </g>
      </svg>
      <p className="mt-2 text-sm text-muted-foreground">{title}</p>
    </div>
  );
}
