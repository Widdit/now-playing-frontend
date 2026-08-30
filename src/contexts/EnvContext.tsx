import React, { createContext, useContext, useEffect, useState } from "react";
import { isTauri } from "@/utils/isTauri";
import { detectTauriEnvironment } from "@/utils/isTauri";

interface EnvContextType {
  isDesktop: boolean;
  isWeb: boolean;
}

const EnvContext = createContext<EnvContextType>({
  isDesktop: false,
  isWeb: true,
});

export const EnvProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 初始值使用同步检测结果作为最佳猜测，避免正常情况下的首屏明显跳动
  const [environment, setEnvironment] = useState<EnvContextType>(() => {
    const desktop = isTauri();
    return {
      isDesktop: desktop,
      isWeb: !desktop,
    };
  });

  useEffect(() => {
    // 首次同步检测已判定为桌面端，结果可信，无需继续校验
    if (environment.isDesktop) {
      return;
    }

    let cancelled = false;

    // 首次同步检测判定为 Web 端时结果并不一定可靠，
    // 因此在后台异步、带重试机制地再次确认，避免应用启动阶段偶发误判
    detectTauriEnvironment().then((desktop) => {
      if (!cancelled && desktop) {
        setEnvironment({
          isDesktop: true,
          isWeb: false,
        });
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <EnvContext.Provider value={environment}>
      {children}
    </EnvContext.Provider>
  );
};

// 自定义 Hook，方便在组件中使用
export const useEnv = () => useContext(EnvContext);
