// src/utils/contextMenuActions
type ToastColor = "primary" | "danger" | "success" | "warning" | "default";

export type AddToastFn = (options: {
  title: string;
  description?: string;
  color?: ToastColor;
  timeout?: number;
}) => void;

export async function toggleFullscreenAction(params: {
  isDesktop: boolean;
  wasMaximizedBeforeFullscreenRef: { current: boolean };
  addToast: AddToastFn;
}): Promise<boolean | undefined> {
  const { isDesktop, wasMaximizedBeforeFullscreenRef, addToast } = params;

  try {
    if (isDesktop) {
      // Tauri 桌面端：切换“原生窗口”的全屏
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();

      // 用原生窗口状态判断
      const isFs = await win.isFullscreen();

      if (!isFs) {
        // 进入全屏：如果当前已最大化，先取消最大化再全屏（否则会出现全屏不覆盖任务栏区域的问题）
        const isMaximized = await win.isMaximized();
        wasMaximizedBeforeFullscreenRef.current = isMaximized;

        if (isMaximized) {
          if ((win as any).unmaximize) {
            await (win as any).unmaximize();
          } else {
            await (win as any).setMaximized(false);
          }
          // 等待窗口状态切换生效后再进入全屏
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        await win.setFullscreen(true);
      } else {
        // 退出全屏：如果进入全屏前是最大化状态，则恢复最大化
        await win.setFullscreen(false);

        if (wasMaximizedBeforeFullscreenRef.current) {
          try {
            await win.maximize();
          } catch {
            // ignore
          }
          wasMaximizedBeforeFullscreenRef.current = false;
        }
      }

      // 返回更新后的状态
      return await win.isFullscreen();
    }

    if (document.fullscreenElement) {
      // 当前是全屏，退出全屏
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } else {
      // 当前不是全屏，进入全屏
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    }

    return !!document.fullscreenElement;
  } catch (error: any) {
    console.error("全屏切换失败:", error);
    addToast({
      title: "全屏切换失败",
      description: error?.message,
      color: "danger",
      timeout: 6000,
    });
    return undefined;
  }
}

export async function openInBrowserOrDesktopAction(params: {
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
    const url = new URL("http://localhost:9864/show");
    url.searchParams.set("url", currentUrl);

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

export async function openDevToolsAction(params: {
  isDesktop: boolean;
  addToast: AddToastFn;
}): Promise<void> {
  const { isDesktop, addToast } = params;

  if (isDesktop) {
    // Tauri 桌面端：调用 Tauri API 打开开发者工具
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      // 调用 Rust 的 open_devtools 命令
      await invoke("open_devtools");
    } catch (error: any) {
      console.error("打开开发者工具失败:", error);
      console.info("请按 F12 打开开发者工具");
      addToast({
        title: "打开失败：" + error?.message,
        description: "请按 F12 打开开发者工具",
        color: "danger",
        timeout: 6000,
      });
    }
    return;
  }

  // 浏览器端：无法通过代码打开开发者工具（安全限制）
  console.info("请按 F12 打开开发者工具");
  addToast({
    title: "开发者工具",
    description: "请按 F12 打开开发者工具",
    color: "primary",
    timeout: 3000,
  });
}
