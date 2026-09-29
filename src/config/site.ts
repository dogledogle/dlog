// 全站唯一配置入口：改这里即可更新站名、描述、导航等。
// TODO: 上线前把 url 换成你自己的域名。
export const site = {
  name: "dlog",
  // 命名约定：中文昵称用「多格」，英文用 dogle（不要用 duoge）
  author: "dogle",
  url: "https://example.com",
  github: "https://github.com/dogledogle",
  // 文章页底部的第三方平台入口
  juejin: "https://juejin.cn/user/78820570563688",
  cnblogs: "https://www.cnblogs.com/duoge",
  description: "写文章、记随笔、存笔记、放诗，以及一些开源作品与小工具。",
  // 顶部导航当前无页面入口（GitHub 与主题切换固定在栏内）；需要时在此添加。
  nav: [] as { title: string; href: string }[],
  // 实验室页面展示的项目，描述为一句话中文简介；languageColor 取 GitHub linguist 配色。
  projects: [
    {
      name: "rolldown-docs-cn",
      description: "Rolldown 中文文档",
      language: "TypeScript",
      languageColor: "#3178c6",
      url: "https://github.com/dogledogle/rolldown-docs-cn",
    },
    {
      name: "docs-proofread-skill",
      description: "面向本地、在线与翻译文档的审校 skill，产出有证据支撑的问题报告",
      language: "Python",
      languageColor: "#3572a5",
      url: "https://github.com/dogledogle/docs-proofread-skill",
    },
    {
      name: "github-page-jump",
      description: "为 GitHub 分页加上首页、末页与任意页直达，一键或按键即可跳转",
      language: "JavaScript",
      languageColor: "#f1e05a",
      url: "https://github.com/dogledogle/github-page-jump",
    },
  ],
} as const;
