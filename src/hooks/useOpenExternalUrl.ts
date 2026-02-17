// useOpenExternalUrl.ts
import { useCallback } from "react";
import { useEnv } from "@/contexts/EnvContext";
import { addToast } from "@heroui/toast";

/**
 * 打开外部链接的自定义 Hook
 * @returns openExternalUrl 函数
 */
export function useOpenExternalUrl() {
  const { isDesktop } = useEnv();

  const openExternalUrl = useCallback(
    async (url: string): Promise<void> => {
      if (isDesktop) {
        // Tauri 桌面端
        try {
          const { openUrl } = await import("@tauri-apps/plugin-opener");
          await openUrl(url);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "未知错误";

          console.error("外部链接打开失败：", error);
          addToast({
            title: "外部链接打开失败",
            description: errorMessage,
            color: "warning",
            timeout: 3000,
          });

          // 降级方案：使用 window.open
          window.open(url, "_blank", "noopener,noreferrer");
        }
      } else {
        // 电脑浏览器
        window.open(url, "_blank", "noopener,noreferrer");
      }
    },
    [isDesktop]
  );

  return { openExternalUrl };
}
