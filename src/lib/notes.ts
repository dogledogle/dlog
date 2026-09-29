import { notes } from "#content";

export type Note = (typeof notes)[number];

// 笔记同样按时间倒序，最新的卡片排最前。
export const publishedNotes = notes
  .filter((note) => !note.draft)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// 卡片内只显示月日，年份由分组标题给出。
export function formatDay(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
  });
}
