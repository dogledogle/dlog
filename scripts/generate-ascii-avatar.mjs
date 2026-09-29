// 把去背头像图转成浅色模式的 ASCII 字符画数据，渲染在首页终端窗口的头像窗格里。
// 用法: node scripts/generate-ascii-avatar.mjs [图片路径]
//       缺省用 public/images/avatar-bg-removed.png（白底、无水印的原素材见 Downloads，
//       右下角「豆包AI生成」水印由本脚本抹除）
// 输出: src/components/ascii-avatar-data-light.ts（整体覆盖，请勿手改该文件）
//
// 深色模式的数据在 src/components/ascii-avatar-data.ts，是已定稿的冻结资产
// （夜景版，暗部无法从这张白底图还原），本脚本不再生成它。
//
// 浅色版规则：
// - 白底图：接近纯白（三通道都 >245 且 max-min<10 的中性色）的像素视为背景，
//   不留字符；眼镜浅蓝高光因明显偏蓝不会被误判。
// - 主体判定按格内 SUB×SUB 子像素的覆盖率统计（≥ SUBJECT_COVERAGE 才算主体），
//   颜色只平均主体子像素，避免白底把边缘格洗淡。
// - 右下角水印压在围巾上：先在其 bbox 内用上下方围巾色逐列线性插值抹除，
//   再走正常管线。
// - 白底上沿用深色版「越亮字符越密」会明暗颠倒（脸比头发黑），因此字符密度
//   反相（越暗越密），最亮处留白成高光，呈「白纸黑墨」效果。
// - 亮度分位数拉伸（5%–97%）只在主体格子上统计，白底不参与。

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// 网格与单元几何：组件里用 SVG 按同样参数渲染（fontSize=12 时的步进 7.2、行高 9.6）。
// COLS×ADV = ROWS×LH = 288，网格本身为正方形，铺满 240×240 的正方形窗格。
const COLS = 40;
const ROWS = 30;
const ADV = 7.2; // 单个字符的横向步进
const LH = 9.6; // 单行高度
const SATURATION = 1.3; // 饱和度增益，与深色版一致

// 浅色模式墨色亮度区间：最暗接近纯黑，最亮为中灰（再亮就看不见了）
const LIGHT_LO = 24;
const LIGHT_HI = 184;
const RAMP = " .:-=+*#%@";

// 主体判定：格内子像素非背景占比达到该值的格子才算主体
const SUBJECT_COVERAGE = 0.3;
// 每个格子的子像素分辨率（SUB×SUB）
const SUB = 8;

// 水印 bbox（原图像素坐标，稍作外扩），及其上下插值锚点的外扩距离
const WATERMARK = { x0: 1670, x1: 2048, y0: 1915, y1: 2032, pad: 10 };

const defaultInput = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "images",
  "avatar-bg-removed.png",
);
const input = process.argv[2] ?? defaultInput;

const meta = await sharp(input).metadata();
if (!meta.width || !meta.height) {
  console.error("无法读取图片尺寸:", input);
  process.exit(1);
}

// 按网格单元的纵横比裁剪（方图不裁）；竖图裁左右、横图裁上下。
const targetAspect = (COLS * ADV) / (ROWS * LH);
let cw = meta.width;
let ch = Math.round(cw / targetAspect);
if (ch > meta.height) {
  ch = meta.height;
  cw = Math.round(ch * targetAspect);
}
const left = Math.min(
  Math.max(Math.round(meta.width / 2 - cw / 2), 0),
  meta.width - cw,
);
const top = Math.min(
  Math.max(Math.round(meta.height / 2 - ch / 2), 0),
  meta.height - ch,
);

// ---- 原图分辨率上先抹水印：bbox 内每列在上下锚点行之间线性插值 ----
const raw = await sharp(input).raw().toBuffer({ resolveWithObject: true });
{
  const { data, info } = raw;
  const W = info.width;
  const chn = info.channels;
  const px = (x, y) => {
    const i = (y * W + x) * chn;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const set = (x, y, [r, g, b]) => {
    const i = (y * W + x) * chn;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  };
  const x0 = Math.max(0, WATERMARK.x0);
  const x1 = Math.min(W - 1, WATERMARK.x1);
  const y0 = Math.max(1, WATERMARK.y0 - WATERMARK.pad);
  const y1 = Math.min(meta.height - 2, WATERMARK.y1 + WATERMARK.pad);
  for (let x = x0; x <= x1; x++) {
    const c0 = px(x, y0 - 1);
    const c1 = px(x, y1 + 1);
    for (let y = y0; y <= y1; y++) {
      const t = (y - (y0 - 1)) / (y1 + 1 - (y0 - 1));
      set(x, y, [
        Math.round(c0[0] + (c1[0] - c0[0]) * t),
        Math.round(c0[1] + (c1[1] - c0[1]) * t),
        Math.round(c0[2] + (c1[2] - c0[2]) * t),
      ]);
    }
  }
}

// ---- 缩到子像素网格，按格统计覆盖率与主体色 ----
const SW = COLS * SUB;
const SH = ROWS * SUB;
const { data: sub } = await sharp(raw.data, {
  raw: { width: raw.info.width, height: raw.info.height, channels: raw.info.channels },
})
  .extract({ left, top, width: cw, height: ch })
  .resize(SW, SH, { fit: "fill" })
  .raw()
  .toBuffer({ resolveWithObject: true });
const subCh = raw.info.channels;

const isWhite = (r, g, b) =>
  r > 245 && g > 245 && b > 245 && Math.max(r, g, b) - Math.min(r, g, b) < 10;

// 每格: { coverage, r, g, b（主体子像素均值） }
const cells = [];
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    let subj = 0, sr = 0, sg = 0, sb = 0;
    for (let dy = 0; dy < SUB; dy++) {
      for (let dx = 0; dx < SUB; dx++) {
        const i = ((y * SUB + dy) * SW + (x * SUB + dx)) * subCh;
        const r = sub[i], g = sub[i + 1], b = sub[i + 2];
        if (!isWhite(r, g, b)) {
          subj++;
          sr += r;
          sg += g;
          sb += b;
        }
      }
    }
    const n = SUB * SUB;
    cells.push({
      coverage: subj / n,
      r: sr / subj,
      g: sg / subj,
      b: sb / subj,
    });
  }
}

// 亮度分位数拉伸只在主体格子上统计
const cellGray = cells.map((c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b);
const subjectGrays = cellGray
  .filter((_, i) => cells[i].coverage >= SUBJECT_COVERAGE)
  .sort((a, b) => a - b);
const lo = subjectGrays[Math.floor(subjectGrays.length * 0.05)];
const hi = subjectGrays[Math.floor(subjectGrays.length * 0.97)];

const normLum = cellGray.map((l) => Math.min(1, Math.max(0, (l - lo) / (hi - lo))));

const clamp255 = (v) => Math.min(255, Math.max(0, Math.round(v)));
const quantize = (v) => Math.round(v / 16) * 16; // 量化后相邻同色格子才能合并成 run

// 颜色管线：色调映射（亮度重映射到 [LIGHT_LO, LIGHT_HI]）+ 饱和度增益 + 量化
const colorOf = (r0, g0, b0, l) => {
  const target = LIGHT_LO + l * (LIGHT_HI - LIGHT_LO);
  const gray = 0.2126 * r0 + 0.7152 * g0 + 0.0722 * b0;
  const scale = gray > 1 ? target / gray : 1;
  const sat = (c) => gray + (c - gray) * SATURATION;
  return (
    "#" +
    [sat(r0 * scale), sat(g0 * scale), sat(b0 * scale)]
      .map((v) => clamp255(quantize(v)).toString(16).padStart(2, "0"))
      .join("")
  );
};

// 字符密度反相：越暗越密，最亮处留白成高光
const charOf = (l) => RAMP[Math.round(Math.pow(1 - l, 0.85) * (RAMP.length - 1))];

// ---- 组装每行的字符与颜色，同行同色相邻格子合并成一个 run ----
// 背景格不生成 run：tspan 按 x 绝对定位，缺格即空白。
const rows = [];
for (let y = 0; y < ROWS; y++) {
  let runs = [];
  let current = null; // { t, c, x }
  let x = 0;
  for (let col = 0; col < COLS; col++) {
    const i = y * COLS + col;
    const cell = cells[i];
    if (cell.coverage < SUBJECT_COVERAGE) {
      current = null;
      x += 1;
      continue;
    }
    const l = normLum[i];
    const ch2 = charOf(l);
    const hex = colorOf(cell.r, cell.g, cell.b, l);

    if (current && current.c === hex) {
      current.t += ch2;
    } else {
      current = { t: ch2, c: hex, x };
      runs.push(current);
    }
    x += ch2.length;
  }
  rows.push(runs);
}

const out = `// 由 scripts/generate-ascii-avatar.mjs 自动生成 —— 请勿手改。
// 重新生成：node scripts/generate-ascii-avatar.mjs [public/images/avatar-bg-removed.png]
// 浅色模式专用：白底去背图自动分割主体、水印已抹除、字符密度相对深色版反相、
// 墨色压暗；深色模式数据在 ascii-avatar-data.ts（冻结，勿用本脚本覆盖）。
// 渲染见 src/components/ascii-avatar.tsx。
export type AsciiRun = { t: string; c: string; x: number };

export const asciiAvatarLight: AsciiRun[][] = ${JSON.stringify(rows)};
`;

const outPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "components",
  "ascii-avatar-data-light.ts",
);
await writeFile(outPath, out, "utf8");
const spans = rows.reduce((s, r) => s + r.length, 0);
const subjectCount = cells.filter((c) => c.coverage >= SUBJECT_COVERAGE).length;
console.log(
  `已生成 ${outPath}（${ROWS} 行 × ${COLS} 列，主体 ${subjectCount} 格，${spans} 个色块）裁剪区域 left=${left} top=${top} ${cw}x${ch}`,
);
