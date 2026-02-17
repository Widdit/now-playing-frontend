// LyricView.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useAtomValue } from "jotai";
import {
  LyricPlayer,
  type LyricPlayerRef
} from "@applemusic-like-lyrics/react";
import { Timer } from "@/utils/timer";
import { TEXT_STROKE } from "@/constants/textStroke";
import { SettingsLyric, DEFAULT_SETTINGS_LYRIC } from "@/types/backend/settingsLyric";
import {
  FONT_SIZE_MAP,
  MOBILE_VERTICAL_FONT_SIZE_MAP,
  MOBILE_HORIZONTAL_FONT_SIZE_MAP
} from "@/constants/fontSizeMap";
import { lyricLinesAtom, isPausedAtom } from "@/atoms/playerAtoms";
import {
  initPlayerService,
  updateSettings,
  disconnectPlayerService,
} from "@/services/playerService";
import "@applemusic-like-lyrics/core/style.css";

/** 暴露给父组件的 ref 接口 */
export interface LyricViewRef {
  getCurrentTime: () => number;
  getSettings: () => SettingsLyric;
  isSettingsLoaded: () => boolean;
  getFontFamilyStyle: () => string;
}

export interface LyricViewProps {
  profileId?: string;
  alignPosition?: number;
  alignAnchor?: "center" | "top" | "bottom";
  lyricRemountKey?: number;
  isMobile?: boolean;
  isVerticalLayout?: boolean;
  className?: string;
  style?: React.CSSProperties;
  settings?: SettingsLyric;
  onSettingsChange?: (settings: SettingsLyric) => void;
}

export const LyricView = forwardRef<LyricViewRef, LyricViewProps>((props, ref) => {
  const {
    profileId,
    alignPosition = 0.5,
    alignAnchor = "center",
    lyricRemountKey = 0,
    isMobile = false,
    isVerticalLayout = false,
    className = "",
    style = {},
    settings: propsSettings,
    onSettingsChange,
  } = props;

  // 设置状态
  const [internalSettings, setInternalSettings] = useState<SettingsLyric>(DEFAULT_SETTINGS_LYRIC);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(propsSettings !== undefined);
  const isFirstInitRef = useRef(true);

  // 如果传入了 settings 属性，则使用它；否则使用内部状态
  const settings = propsSettings ?? internalSettings;

  // 时间状态
  const [currentTime, setCurrentTime] = useState(0);
  const timerRef = useRef(new Timer());
  const timer = timerRef.current;

  // 歌词和播放状态（从 atom 读取）
  const lyricLines = useAtomValue(lyricLinesAtom);
  const isPaused = useAtomValue(isPausedAtom);

  // LyricPlayer ref
  const lyricPlayerRef = useRef<LyricPlayerRef>(null);

  // 字体样式
  const fontFamilyStyle = useMemo(() => {
    return `${settings.primaryFont}, ${settings.fallbackFont}`;
  }, [settings.primaryFont, settings.fallbackFont]);

  // 暴露 ref
  useImperativeHandle(
    ref,
    () => ({
      getCurrentTime: () => currentTime,
      getSettings: () => settings,
      isSettingsLoaded: () => isSettingsLoaded,
      getFontFamilyStyle: () => fontFamilyStyle,
    }),
    [currentTime, settings, isSettingsLoaded, fontFamilyStyle]
  );

  // 当传入 propsSettings 时，同步更新 isSettingsLoaded
  useEffect(() => {
    if (propsSettings !== undefined) {
      setIsSettingsLoaded(true);
    }
  }, [propsSettings]);

  // 获取设置
  useEffect(() => {
    // 如果传入了 settings 属性，则不通过 API 获取
    if (propsSettings !== undefined) {
      return;
    }

    const buildUrl = () => {
      let url = "/api/lyric/settings";
      if (profileId) {
        const params = new URLSearchParams({ id: profileId });
        url += `?${params.toString()}`;
      }
      return url;
    };

    const fetchSettings = async () => {
      try {
        const url = buildUrl();
        const res = await fetch(url, { method: "GET" });

        if (!res.ok) {
          throw new Error(`HTTP 响应错误！状态码：${res.status}`);
        }

        const data = (await res.json()) as SettingsLyric;

        setInternalSettings((prev) => {
          if (prev.lastUpdateTime === data.lastUpdateTime) {
            return prev;
          }
          return data;
        });
      } catch (e) {
        console.error("读取歌词设置失败：" + e);
      } finally {
        setIsSettingsLoaded((prev) => {
          if (!prev) return true;
          return prev;
        });
      }
    };

    fetchSettings();

    const timerId = window.setInterval(() => {
      fetchSettings();
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [profileId, propsSettings]);

  // 当 settings 变化时通知父组件
  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  }, [settings, onSettingsChange]);

  // 初始化播放器服务
  useEffect(() => {
    if (!isSettingsLoaded) {
      return;
    }

    initPlayerService(timer, settings);

    return () => {
      disconnectPlayerService();
      timer.pause();
    };
  }, [isSettingsLoaded]);

  // 更新设置
  useEffect(() => {
    if (!isSettingsLoaded) {
      return;
    }

    if (isFirstInitRef.current) {
      isFirstInitRef.current = false;
      return;
    }

    updateSettings(settings);
  }, [settings, isSettingsLoaded]);

  // 动画帧循环
  useEffect(() => {
    let rafId: number;

    const frame = () => {
      if (!isPaused) {
        setCurrentTime(timer.getTime());
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isPaused, timer]);

  // 注入样式
  useEffect(() => {
    const styleId = "inject-style";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const shadowStyle = settings.shadowEnabled
      ? `filter: drop-shadow(${settings.shadowXOffset}px ${settings.shadowYOffset}px ${settings.shadowBlur}px ${settings.shadowColor});`
      : ``;

    styleEl.innerHTML = `
      ._interludeDots_ut4sn_151 {
        left: ${settings.interludeDotsPosition}em;
        ${shadowStyle}
      }

      ._lyricSubLine_ut4sn_136 {
        font-size: max(${settings.subLineFontSize}em, 10px);
      }
    `;
  }, [
    settings.interludeDotsPosition,
    settings.subLineFontSize,
    settings.shadowEnabled,
    settings.shadowXOffset,
    settings.shadowYOffset,
    settings.shadowBlur,
    settings.shadowColor,
  ]);

  // font-face 样式
  const fontFaceStyle = useMemo(() => {
    return `
    @font-face {
      font-family: "${settings.primaryFont}";
      src: local("${settings.primaryFont}");
    }

    @font-face {
      font-family: "${settings.fallbackFont}";
      src: local("${settings.fallbackFont}");
    }
  `;
  }, [settings.primaryFont, settings.fallbackFont]);

  // 字体大小
  const fontSizeStyle = useMemo(() => {
    if (isMobile) {
      if (isVerticalLayout) {
        return (
          MOBILE_VERTICAL_FONT_SIZE_MAP[settings.fontSize] ??
          MOBILE_VERTICAL_FONT_SIZE_MAP["medium"]
        );
      }
      return (
        MOBILE_HORIZONTAL_FONT_SIZE_MAP[settings.fontSize] ??
        MOBILE_HORIZONTAL_FONT_SIZE_MAP["medium"]
      );
    }
    return FONT_SIZE_MAP[settings.fontSize] ?? FONT_SIZE_MAP["medium"];
  }, [settings.fontSize, isMobile, isVerticalLayout]);

  // 文字阴影和描边
  const textShadowStyle = useMemo(() => {
    const parts = [];

    if (settings.shadowEnabled) {
      parts.push(
        `${settings.shadowXOffset}px ${settings.shadowYOffset}px ${settings.shadowBlur}px ${settings.shadowColor}`
      );
    }

    if (settings.strokeEnabled) {
      parts.push(TEXT_STROKE);
    }

    return parts.join(", ") || undefined;
  }, [
    settings.shadowEnabled,
    settings.shadowXOffset,
    settings.shadowYOffset,
    settings.shadowBlur,
    settings.shadowColor,
    settings.strokeEnabled,
  ]);

  return (
    <>
      <style>{fontFaceStyle}</style>

      <LyricPlayer
        key={`lyric-${lyricRemountKey}`}
        ref={lyricPlayerRef}
        className={className}
        alignPosition={alignPosition}
        alignAnchor={alignAnchor}
        currentTime={Math.max(0, currentTime + settings.timeOffset)}
        enableBlur={settings.blurEffectEnabled}
        enableScale={settings.scaleEffectEnabled}
        enableSpring={settings.springAnimationEnabled}
        hidePassedLines={settings.hidePassedLines}
        lyricLines={lyricLines}
        playing={!isPaused}
        style={{
          "--amll-lp-font-size": fontSizeStyle,
          "--amll-lp-color": settings.color,
          "--stroke-color": settings.strokeColor,
          fontFamily: fontFamilyStyle,
          fontWeight: settings.boldEnabled ? "bold" : undefined,
          letterSpacing: `${settings.letterSpacing}em`,
          textShadow: textShadowStyle,
          textAlign: settings.textAlign as React.CSSProperties["textAlign"],
          transform: `perspective(${settings.perspective}px) rotateX(${settings.rotateX}deg) rotateY(${settings.rotateY}deg) translateX(${settings.translateX}px) translateY(${settings.translateY}px)`,
          ...style,
        }}
      />
    </>
  );
});
