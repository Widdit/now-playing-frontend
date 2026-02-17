// useDefaultMenuItems.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { MenuItem } from "@/types/contextMenu";
import { ArrowLeft, ArrowRight, MaximizeOne, MinimizeOne, Tool } from "@mynaui/icons-react";
import { RotateCw, Globe, Monitor } from "lucide-react";
import { useEnv } from "@/contexts/EnvContext";
import { addToast } from "@heroui/toast";
import { toggleFullscreenAction, openInBrowserOrDesktopAction, openDevToolsAction } from "@/utils/contextMenuActions";

// 扩展 Navigation API 类型声明
declare global {
  interface Window {
    navigation?: {
      canGoBack: boolean;
      canGoForward: boolean;
      addEventListener?: (type: string, listener: () => void) => void;
      removeEventListener?: (type: string, listener: () => void) => void;
    };
  }
}

export const useDefaultMenuItems = (): MenuItem[] => {
  const { isDesktop } = useEnv();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canGoBack, setCanGoBack] = useState(true);
  const [canGoForward, setCanGoForward] = useState(false);
  const wasMaximizedBeforeFullscreenRef = useRef(false);

  // 检查是否可以返回/前进
  const checkNavigationState = useCallback(() => {
    // 尝试使用 Navigation API (Chrome 102+, Edge 102+)
    if (window.navigation) {
      setCanGoBack(window.navigation.canGoBack);
      setCanGoForward(window.navigation.canGoForward);
    } else {
      // 降级方案：使用 history.length 进行估计
      // history.length > 1 表示有历史记录
      // 注意：无法准确判断当前在历史栈中的位置
      setCanGoBack(window.history.length > 1);
      // 降级情况下无法准确检测是否可以前进
      // 保守策略：假设不能前进（用户点击后无效果也不影响体验）
      setCanGoForward(false);
    }
  }, []);

  // 监听历史记录变化
  useEffect(() => {
    checkNavigationState();

    // 监听 popstate 事件（浏览器后退/前进时触发）
    window.addEventListener("popstate", checkNavigationState);

    // 如果 Navigation API 可用，监听 currententrychange 事件
    const navigation = window.navigation;
    if (navigation?.addEventListener) {
      navigation.addEventListener("currententrychange", checkNavigationState);
    }

    return () => {
      window.removeEventListener("popstate", checkNavigationState);
      if (navigation?.removeEventListener) {
        navigation.removeEventListener("currententrychange", checkNavigationState);
      }
    };
  }, [checkNavigationState]);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    // 初始化全屏状态
    const initFullscreenState = async () => {
      if (isDesktop) {
        // 桌面端：通过 Tauri API 检测全屏状态
        try {
          const { getCurrentWindow } = await import("@tauri-apps/api/window");
          const appWindow = getCurrentWindow();
          const fullscreen = await appWindow.isFullscreen();
          setIsFullscreen(fullscreen);
        } catch (error) {
          console.error("Failed to get fullscreen state from Tauri:", error);
          // 降级到浏览器 API
          setIsFullscreen(!!document.fullscreenElement);
        }
      } else {
        // 浏览器端：使用 document.fullscreenElement
        setIsFullscreen(!!document.fullscreenElement);
      }
    };

    initFullscreenState();

    // 监听各种浏览器的全屏事件
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [isDesktop]);

  // 返回上一页
  const handleBack = useCallback(() => {
    window.history.back();
    // 延迟更新状态
    setTimeout(checkNavigationState, 100);
  }, [checkNavigationState]);

  // 前进下一页
  const handleForward = useCallback(() => {
    window.history.forward();
    // 延迟更新状态
    setTimeout(checkNavigationState, 100);
  }, [checkNavigationState]);

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

  // 构建菜单项
  const menuItems = useMemo<MenuItem[]>(() => [
    {
      key: "back",
      label: "返回",
      startContent: <ArrowLeft size={16} stroke={2} color={canGoBack ? "#a0a0aa" : "#828384"} />,
      onClick: handleBack,
      disabled: !canGoBack,
    },
    {
      key: "forward",
      label: "前进",
      startContent: <ArrowRight size={16} stroke={2} color={canGoForward ? "#a0a0aa" : "#828384"} />,
      onClick: handleForward,
      disabled: !canGoForward,
    },
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
      key: "devTools",
      label: "检查",
      startContent: <Tool size={16} stroke={2} color="#a0a0aa" />,
      onClick: handleDevTools,
    },
  ], [
    isFullscreen,
    isDesktop,
    canGoBack,
    canGoForward,
    handleBack,
    handleForward,
    handleRefresh,
    handleFullscreen,
    handleOpenInBrowser,
    handleDevTools,
  ]);

  return menuItems;
};
