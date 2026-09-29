import { essays } from "#content";

export type Essay = (typeof essays)[number];

// 随笔按时间倒序——feed 里最新的想法排最前。
export const publishedEssays = essays
  .filter((essay) => !essay.draft)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// 卡片内只显示月日，年份由分组标题给出。
export function formatDay(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
  });
}
