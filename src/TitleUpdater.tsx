import { useLocation } from "react-router-dom";
import { useEffect } from "react";

export function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const titleMap: Record<string, string> = {
      "/": "主页 | Now Playing",
      "/widgetDesktop": "Now Playing 歌曲组件",
      "/lyric": "Now Playing 歌词组件",
      "/player": "Now Playing 播放器",
      "/markdown/editor": "Markdown 编辑器",
      "/settings": "通用 | Now Playing",
      "/settings/general": "通用 | Now Playing",
      "/settings/lyric": "歌词组件 | Now Playing",
      "/settings/player": "播放器 | Now Playing",
      "/settings/desktop": "桌面组件 | Now Playing",
      "/settings/camera": "虚拟摄像头 | Now Playing",
      "/settings/output": "歌曲信息输出 | Now Playing",
      "/apiPage": "API 接口 | Now Playing",
      "/extension": "扩展功能 | Now Playing",
      "/extension/window": "窗口模式 | Now Playing",
      "/extension/deployment": "页面部署 | Now Playing",
      "/sponsor": "赞助 | Now Playing",
      "/about": "关于 | Now Playing",
    };

    let title = titleMap[location.pathname];

    if (!title && location.pathname.startsWith("/lyric/")) {
      title = "Now Playing 歌词组件";
    }

    if (title) {
      document.title = title;
    } else {
      document.title = "404 | Now Playing";
    }
  }, [location.pathname]);

  return null;
}
