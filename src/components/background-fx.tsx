// 纯 CSS 动态背景（见 globals.css 的 .background-fx）：无客户端 JS。
export function BackgroundFX() {
  return (
    <div aria-hidden className="background-fx">
      <span className="background-blob background-blob-a" />
      <span className="background-blob background-blob-b" />
    </div>
  );
}
