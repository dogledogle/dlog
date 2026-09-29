import { poems } from "#content";

// 诗集按写作时间正序排列——从头读起，是一本按时间生长的诗集。
// 同一天多首时按文件名（笔记页码顺序）稳定排序。
export const publishedPoems = [...poems].sort(
  (a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug),
);
