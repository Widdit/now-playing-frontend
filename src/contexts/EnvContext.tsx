import React, { createContext, useContext, useMemo } from "react";
import { isTauri } from "@/utils/isTauri";

interface EnvContextType {
  isDesktop: boolean;
  isWeb: boolean;
}

const EnvContext = createContext<EnvContextType>({
  isDesktop: false,
  isWeb: true,
});

export const EnvProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 使用 useMemo 只在组件挂载时计算一次
  const environment = useMemo(() => {
    const desktop = isTauri();
    return {
      isDesktop: desktop,
      isWeb: !desktop,
    };
  }, []);

  return (
    <EnvContext.Provider value={environment}>
      {children}
    </EnvContext.Provider>
  );
};

// 自定义 Hook，方便在组件中使用
export const useEnv = () => useContext(EnvContext);
