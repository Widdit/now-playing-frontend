// 扩展 window 接口，防止 TS 报错
declare global {
  interface Window {
    __TAURI__?: any;
    __TAURI_IPC__?: any;
    __TAURI_INTERNALS__?: any;
  }
}

/**
 * 检测当前是否运行在 Tauri 环境中
 */
export const isTauri = (): boolean => {
  // 确保在浏览器环境执行（SSR兼容）
  if (typeof window === 'undefined') {
    return false;
  }

  // 检测 Tauri 特有的 window 属性
  // 兼容 Tauri v1 和 v2
  return !!(window.__TAURI__ || window.__TAURI_IPC__ || window.__TAURI_INTERNALS__);
};
