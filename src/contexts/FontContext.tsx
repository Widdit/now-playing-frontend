import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface FontData {
  postscriptName: string;
  fullName: string;
  family: string;
  style: string;
}

interface FontContextType {
  fonts: FontData[];
  isLoading: boolean;
  error: string | null;
  needsAuthorization: boolean;
  refresh: () => Promise<void>;
  authorize: () => Promise<void>;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

// 判断是否为英文字体（首字符为英文字母）
const isEnglishFont = (name: string): boolean => {
  const firstChar = name.charAt(0);
  return /^[a-zA-Z]$/.test(firstChar);
};

// 模块级别的全局缓存
let globalFontsCache: FontData[] | null = null;
let globalFontsPromise: Promise<FontData[]> | null = null;
let hasAuthorized = false;

// 订阅者管理（用于通知所有组件更新）
type FontRefreshCallback = (fonts: FontData[], needsAuth: boolean) => void;
const fontRefreshListeners = new Set<FontRefreshCallback>();

const subscribeFontRefresh = (callback: FontRefreshCallback) => {
  fontRefreshListeners.add(callback);
  return () => {
    fontRefreshListeners.delete(callback);
  };
};

const notifyFontRefresh = (fonts: FontData[], needsAuth: boolean) => {
  fontRefreshListeners.forEach((callback) => callback(fonts, needsAuth));
};

// 获取并排序字体的核心函数
const fetchAndSortFonts = async (): Promise<FontData[]> => {
  if (!("queryLocalFonts" in window)) {
    throw new Error("当前浏览器不支持获取本地字体");
  }

  const localFonts = await (window as any).queryLocalFonts();
  const fontMap = new Map<string, FontData>();

  localFonts.forEach((font: any) => {
    if (!fontMap.has(font.postscriptName)) {
      fontMap.set(font.postscriptName, {
        postscriptName: font.postscriptName,
        fullName: font.fullName,
        family: font.family,
        style: font.style,
      });
    }
  });

  const sortedFonts = Array.from(fontMap.values()).sort((a, b) => {
    const aIsEnglish = isEnglishFont(a.fullName);
    const bIsEnglish = isEnglishFont(b.fullName);

    if (aIsEnglish && !bIsEnglish) return 1;
    if (!aIsEnglish && bIsEnglish) return -1;
    return a.fullName.localeCompare(b.fullName);
  });

  hasAuthorized = true;
  return sortedFonts;
};

// 尝试静默获取字体（如果之前已授权）
const tryGetFontsSilently = async (): Promise<{ fonts: FontData[]; needsAuth: boolean }> => {
  if (globalFontsCache) {
    return { fonts: globalFontsCache, needsAuth: false };
  }

  if (!("queryLocalFonts" in window)) {
    throw new Error("当前浏览器不支持获取本地字体");
  }

  try {
    // 尝试查询权限状态
    const permission = await navigator.permissions.query({
      name: "local-fonts" as PermissionName,
    });

    if (permission.state === "granted") {
      // 已授权，可以直接获取
      const fonts = await fetchAndSortFonts();
      globalFontsCache = fonts;
      return { fonts, needsAuth: false };
    } else if (permission.state === "denied") {
      // 已拒绝
      throw new Error("字体访问权限已被拒绝，请在浏览器设置中允许");
    } else {
      // prompt 状态，需要用户交互
      return { fonts: [], needsAuth: true };
    }
  } catch (err: any) {
    // 某些浏览器不支持 permissions.query for local-fonts
    // 这种情况下需要用户点击授权
    if (err.message?.includes("字体访问权限已被拒绝")) {
      throw err;
    }
    return { fonts: [], needsAuth: true };
  }
};

// 导出的刷新函数 - 供外部调用（需要用户交互触发）
export const refreshLocalFonts = async (): Promise<FontData[]> => {
  // 清除缓存
  globalFontsCache = null;
  globalFontsPromise = null;

  // 重新获取
  const fonts = await fetchAndSortFonts();

  // 更新缓存
  globalFontsCache = fonts;

  // 通知所有订阅者更新
  notifyFontRefresh(fonts, false);

  return fonts;
};

// 导出的授权函数 - 供外部调用（需要用户交互触发）
export const authorizeLocalFonts = async (): Promise<FontData[]> => {
  const fonts = await fetchAndSortFonts();
  globalFontsCache = fonts;
  notifyFontRefresh(fonts, false);
  return fonts;
};

interface FontProviderProps {
  children: ReactNode;
}

const FontProviderInner: React.FC<FontProviderProps> = ({ children }) => {
  const [fonts, setFonts] = useState<FontData[]>(globalFontsCache || []);
  const [isLoading, setIsLoading] = useState<boolean>(!globalFontsCache && hasAuthorized);
  const [error, setError] = useState<string | null>(null);
  const [needsAuthorization, setNeedsAuthorization] = useState<boolean>(false);

  // 组件内的授权函数
  const authorize = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newFonts = await authorizeLocalFonts();
      setFonts(newFonts);
      setNeedsAuthorization(false);
    } catch (err: any) {
      console.error("Failed to authorize local fonts:", err);
      setError(err.message || "获取本地字体失败，请授予权限后重试");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 组件内的刷新函数
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newFonts = await refreshLocalFonts();
      setFonts(newFonts);
    } catch (err: any) {
      console.error("Failed to refresh local fonts:", err);
      setError(err.message || "获取本地字体失败，请授予权限后重试");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 如果已有缓存，直接使用
    if (globalFontsCache) {
      setFonts(globalFontsCache);
      setIsLoading(false);
      setNeedsAuthorization(false);
      return;
    }

    // 尝试静默获取
    setIsLoading(true);
    tryGetFontsSilently()
      .then(({ fonts: sortedFonts, needsAuth }) => {
        if (needsAuth) {
          setNeedsAuthorization(true);
        } else {
          setFonts(sortedFonts);
          setNeedsAuthorization(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch local fonts:", err);
        setError(err.message || "获取本地字体失败");
      })
      .finally(() => {
        setIsLoading(false);
      });

    // 订阅刷新事件
    const unsubscribe = subscribeFontRefresh((newFonts, needsAuth) => {
      setFonts(newFonts);
      setNeedsAuthorization(needsAuth);
      setIsLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, []);

  return (
    <FontContext.Provider value={{ fonts, isLoading, error, needsAuthorization, refresh, authorize }}>
      {children}
    </FontContext.Provider>
  );
};

// 自动包裹 Provider 的组件
export const FontProvider: React.FC<FontProviderProps> = ({ children }) => {
  const existingContext = useContext(FontContext);

  // 如果已经在 Provider 中，直接返回 children
  if (existingContext !== undefined) {
    return <>{children}</>;
  }

  // 否则包裹一个新的 Provider
  return <FontProviderInner>{children}</FontProviderInner>;
};

export const useFonts = (): FontContextType => {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFonts must be used within a FontProvider");
  }
  return context;
};
