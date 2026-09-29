// 把 src/app/icon.svg 栅格化，生成 src/app/favicon.ico（16/32/48，PNG 压缩帧）
// 与 src/app/apple-icon.png（180×180，Apple 桌面/主屏触屏图标）。
// 用法: node scripts/generate-favicon.mjs
// 说明: ico 采用 PNG-in-ICO 容器（Vista+ 与所有主流浏览器均支持）；
//       SVG 矢量稿永远是设计源头，本脚本只负责出位图，请勿手改产物。

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = path.join(root, "src", "app", "icon.svg");

const ICO_SIZES = [16, 32, 48];
const APPLE_SIZE = 180;
// 先在高分辨率母版上渲染再缩小，得到的抗锯齿与浏览器实际缩放观感一致
const MASTER_SIZE = 800;

const svg = await readFile(svgPath);
const master = await sharp(svg, { density: (72 * MASTER_SIZE) / 100 })
  .png()
  .toBuffer();

const pngs = await Promise.all(
  ICO_SIZES.map(async (size) => ({
    size,
    buffer: await sharp(master).resize(size, size).png().toBuffer(),
  })),
);

// PNG-in-ICO：6 字节 ICONDIR + 每帧 16 字节 ICONDIRENTRY + 各帧 PNG 原始数据
function packIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // 类型 1 = 图标
  header.writeUInt16LE(frames.length, 4);
  let offset = 6 + 16 * frames.length;
  const dir = frames.map(({ size, buffer }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0); // 宽（256 写 0，这里最大 48）
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4); // 颜色平面数
    entry.writeUInt16LE(32, 6); // 位深
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += buffer.length;
    return entry;
  });
  return Buffer.concat([header, ...dir, ...frames.map((f) => f.buffer)]);
}

const apple = await sharp(master).resize(APPLE_SIZE, APPLE_SIZE).png().toBuffer();
await writeFile(path.join(root, "src", "app", "favicon.ico"), packIco(pngs));
await writeFile(path.join(root, "src", "app", "apple-icon.png"), apple);
console.log(
  `已生成 favicon.ico（${ICO_SIZES.join("/")}）与 apple-icon.png（${APPLE_SIZE}×${APPLE_SIZE}），源自 icon.svg`,
);
