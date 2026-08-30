// isTauri.ts
import { isTauri as isTauriOfficial } from "@tauri-apps/api/core";

// 扩展 window 接口，防止 TS 报错
declare global {
  interface Window {
    __TAURI__?: any;
    __TAURI_IPC__?: any;
    __TAURI_INTERNALS__?: any;
    isTauri?: boolean;
  }
}

interface DetectTauriOptions {
  /** 轮询间隔（毫秒） */
  interval?: number;
  /** 最大等待时间（毫秒） */
  timeout?: number;
}

/**
 * 检测当前是否运行在 Tauri 环境中
 */
export const isTauri = (): boolean => {
  // 确保在浏览器环境执行（SSR兼容）
  if (typeof window === "undefined") {
    return false;
  }

  // 优先使用 Tauri 官方提供的环境检测方法
  if (isTauriOfficial()) {
    return true;
  }

  // 检测 Tauri 特有的 window 属性
  // 兼容 Tauri v1 和 v2
  return !!(window.__TAURI__ || window.__TAURI_IPC__ || window.__TAURI_INTERNALS__);
};

/**
 * 可靠检测当前页面是否运行在 Tauri 环境中
 *
 * 首次检测为 false 时，可能是 Tauri 环境标记尚未完成初始化。
 * 因此在短时间内进行轮询确认，避免应用启动阶段偶发误判。
 */
export const detectTauriEnvironment = (
  options: DetectTauriOptions = {}
): Promise<boolean> => {
  const { interval = 30, timeout = 1000 } = options;

  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    // 正常情况下立即返回，避免产生任何额外延迟
    if (isTauri()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();

    const timer = setInterval(() => {
      if (isTauri()) {
        clearInterval(timer);
        resolve(true);
        return;
      }

      if (Date.now() - startTime >= timeout) {
        clearInterval(timer);
        resolve(false);
      }
    }, interval);
  });
};
