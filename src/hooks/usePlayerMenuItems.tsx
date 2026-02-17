// usePlayerMenuItems.tsx
import {useState, useEffect, useCallback, useMemo, useRef} from "react";
import { MenuItem } from "@/types/contextMenu";
import { MaximizeOne, MinimizeOne, Tool, Check } from "@mynaui/icons-react";
import { RotateCw, Globe, Monitor } from "lucide-react";
import { useEnv } from "@/contexts/EnvContext";
import { addToast } from "@heroui/toast";
import {
  toggleFullscreenAction,
  openDevToolsAction,
  AddToastFn
} from "@/utils/contextMenuActions";

interface UsePlayerMenuItemsOptions {
  showLyric: boolean;
  setShowLyric: (value: boolean) => void;
  backgroundRenderer: string;
  setBackgroundRenderer: (value: string) => void;
}

async function openInBrowserOrDesktopAction(params: {
  isDesktop: boolean;
  addToast: AddToastFn;
}): Promise<void> {
  const { isDesktop, addToast } = params;
  const currentUrl = window.location.href;

  if (isDesktop) {
    // Tauri 桌面端：使用默认浏览器打开当前页面
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(currentUrl);
    } catch (error: any) {
      console.error("用浏览器打开失败:", error);
      addToast({
        title: "用浏览器打开失败",
        description: error?.message,
        color: "danger",
        timeout: 6000,
      });
      // 降级方案：使用 window.open
      window.open(currentUrl, "_blank", "noopener,noreferrer");
    }
    return;
  }

  // 浏览器端：向桌面端发送请求
  try {
    const url = new URL("http://localhost:9864/player/show");

    await fetch(url.toString(), {
      method: "GET",
      mode: "no-cors", // 避免 CORS 问题，但无法获取响应
    });
  } catch (error: any) {
    console.error("向桌面端发送请求失败:", error);
    addToast({
      title: "向桌面端发送请求失败",
      description: error?.message,
      color: "danger",
      timeout: 6000,
    });
  }
}

export const usePlayerMenuItems = (options: UsePlayerMenuItemsOptions): MenuItem[] => {
  const { isDesktop } = useEnv();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { showLyric, setShowLyric, backgroundRenderer, setBackgroundRenderer } = options;
  const wasMaximizedBeforeFullscreenRef = useRef(false);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    // 监听各种浏览器的全屏事件
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    // 初始化状态
    setIsFullscreen(!!document.fullscreenElement);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // 刷新页面
  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  // 切换全屏
  const handleFullscreen = useCallback(async () => {
    const next = await toggleFullscreenAction({
      isDesktop,
      wasMaximizedBeforeFullscreenRef,
      addToast,
    });

    if (typeof next === "boolean") {
      setIsFullscreen(next);
    }
  }, [isDesktop]);

  // 用浏览器打开 / 用桌面端打开
  const handleOpenInBrowser = useCallback(async () => {
    await openInBrowserOrDesktopAction({
      isDesktop,
      addToast,
    });
  }, [isDesktop]);

  // 打开开发者工具
  const handleDevTools = useCallback(async () => {
    await openDevToolsAction({
      isDesktop,
      addToast,
    });
  }, [isDesktop]);

  // 切换显示歌词
  const handleToggleLyric = useCallback(() => {
    setShowLyric(!showLyric);
  }, [showLyric, setShowLyric]);

  // 设置网格渐变渲染器
  const handleSetMeshGradientRenderer = useCallback(() => {
    setBackgroundRenderer("MeshGradientRenderer");
  }, [setBackgroundRenderer]);

  // 设置 Pixi 渲染器
  const handleSetPixiRenderer = useCallback(() => {
    setBackgroundRenderer("PixiRenderer");
  }, [setBackgroundRenderer]);

  // 构建菜单项
  const menuItems = useMemo<MenuItem[]>(() => [
    {
      key: "refresh",
      label: "刷新",
      startContent: <RotateCw size={15} color="#a0a0aa" width={16} />,
      onClick: handleRefresh,
      showDivider: true,
    },
    {
      key: "fullScreen",
      label: isFullscreen ? "退出全屏" : "全屏",
      startContent: isFullscreen
        ? <MinimizeOne size={16} stroke={2} color="#a0a0aa" />
        : <MaximizeOne size={16} stroke={2} color="#a0a0aa" />,
      onClick: handleFullscreen,
    },
    {
      key: "browser",
      label: isDesktop ? "用浏览器打开" : "用桌面端打开",
      startContent: isDesktop
        ? <Globe size={15} color="#a0a0aa" width={16} />
        : <Monitor size={15} color="#a0a0aa" width={16} />,
      onClick: handleOpenInBrowser,
      showDivider: true,
    },
    {
      key: "showLyric",
      label: "显示歌词",
      onClick: handleToggleLyric,
      endContent: showLyric ? <Check size={17} stroke={2} color="#a0a0aa" /> : undefined,
    },
    {
      key: "backgroundRenderer",
      label: "背景渲染器",
      children: [
        {
          key: "meshGradientRenderer",
          label: "网格渐变渲染器",
          onClick: handleSetMeshGradientRenderer,
          endContent: backgroundRenderer === "MeshGradientRenderer" ? <Check size={17} stroke={2} color="#a0a0aa" /> : undefined,
        },
        {
          key: "pixiRenderer",
          label: "Pixi 渲染器",
          onClick: handleSetPixiRenderer,
          endContent: backgroundRenderer === "PixiRenderer" ? <Check size={17} stroke={2} color="#a0a0aa" /> : undefined,
        },
      ],
      showDivider: true,
    },
    {
      key: "devTools",
      label: "检查",
      startContent: <Tool size={16} stroke={2} color="#a0a0aa" />,
      onClick: handleDevTools,
    },
  ], [
    isFullscreen,
    isDesktop,
    showLyric,
    backgroundRenderer,
    handleRefresh,
    handleFullscreen,
    handleOpenInBrowser,
    handleToggleLyric,
    handleSetMeshGradientRenderer,
    handleSetPixiRenderer,
    handleDevTools,
  ]);

  return menuItems;
};
