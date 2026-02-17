// Player.tsx
import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { useLocation } from "react-router-dom";
import { useAtomValue } from "jotai";
import { BackgroundRender } from "@applemusic-like-lyrics/react";
import { MeshGradientRenderer, PixiRenderer } from "@applemusic-like-lyrics/core";
import { SettingsLyric, DEFAULT_SETTINGS_LYRIC } from "@/types/backend/settingsLyric";
import { LyricView, type LyricViewRef } from "@/components/LyricView";
import {
  coverUrlAtom,
  titleAtom,
  authorAtom,
  durationAtom,
} from "@/atoms/playerAtoms";
import { fetchCoverBase64 } from "@/services/playerService";
import "@applemusic-like-lyrics/core/style.css";
import "@/styles/player.css";
import { AutoHideCursor } from "@/components/AutoHideCursor";
import TitleBar from "@/components/TitleBar";
import { useEnv } from "@/contexts/EnvContext";
import { motion } from "framer-motion";
import { usePlayerMenuItems } from "@/hooks/usePlayerMenuItems";
import { useCustomContextMenu } from "@/hooks/useCustomContextMenu";
import { SongInfo, VerticalSongInfo } from "@/components/player/SongInfo";
import { ProgressControl, VerticalProgressControl } from "@/components/player/ProgressControl";

// 检测是否是移动设备的 hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    const isMobileUA = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(userAgent);

    // 也可以通过触摸支持来判断
    const hasTouchScreen = navigator.maxTouchPoints > 0;

    setIsMobile(isMobileUA || hasTouchScreen);
  }, []);

  return isMobile;
};

// 检测是否竖屏（增加防抖：等待 viewport 尺寸稳定后再更新）
const useStableIsPortrait = (delay = 180) => {
  const getIsPortrait = () =>
    typeof window !== "undefined"
      ? window.matchMedia?.("(orientation: portrait)")?.matches ??
      window.innerHeight >= window.innerWidth
      : false;

  const [isPortrait, setIsPortrait] = useState(getIsPortrait);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia?.("(orientation: portrait)");

    const scheduleUpdate = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      // 等 resize/orientationchange 连续抖动结束再落定
      timerRef.current = window.setTimeout(() => {
        setIsPortrait(getIsPortrait());
      }, delay);
    };

    // 先跑一次，保证初值一致
    scheduleUpdate();

    window.addEventListener("orientationchange", scheduleUpdate, { passive: true } as any);
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    if (mq) {
      mq.addEventListener("change", scheduleUpdate);
    }

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.removeEventListener("orientationchange", scheduleUpdate as any);
      window.removeEventListener("resize", scheduleUpdate);
      if (mq) mq.removeEventListener("change", scheduleUpdate);
    };
  }, [delay]);

  return isPortrait;
};

export default function PlayerPage() {
  const { isDesktop } = useEnv();
  const { search } = useLocation();
  const isWidget = new URLSearchParams(search).has("widget");
  const urlIsVertical = new URLSearchParams(search).has("vertical");

  // 检测是否是移动设备 + 是否竖屏
  const isMobile = useIsMobile();
  const isPortrait = useStableIsPortrait(180);

  // 渲染垂直布局的条件：URL 参数强制垂直，或者移动设备方向为竖屏
  const isVertical = urlIsVertical || (isMobile && isPortrait);

  // LyricView ref
  const lyricViewRef = useRef<LyricViewRef>(null);

  // settings 状态（从 LyricView 回调获取）
  const [settings, setSettings] = useState<SettingsLyric>(DEFAULT_SETTINGS_LYRIC);

  // 用于 requestAnimationFrame 更新进度条
  const [displayTime, setDisplayTime] = useState(0);

  const coverUrl = useAtomValue(coverUrlAtom);
  const [coverBase64, setCoverBase64] = useState<string | undefined>();

  const title = useAtomValue(titleAtom);
  const author = useAtomValue(authorAtom);
  // const album = useAtomValue(albumAtom);
  const duration = useAtomValue(durationAtom);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const coverRef = useRef<HTMLDivElement>(null);
  const lyricLayoutRef = useRef<HTMLDivElement>(null);
  const [alignPosition, setAlignPosition] = useState(0.5);
  const [alignAnchor, setAlignAnchor] = useState<"center" | "bottom" | "top">("center");

  const [showLyric, setShowLyric] = useState(true);
  const [backgroundRenderer, setBackgroundRenderer] = useState("MeshGradientRenderer");

  const [lyricRemountKey, setLyricRemountKey] = useState(0);

  const playerMenuItems = usePlayerMenuItems({
    showLyric,
    setShowLyric,
    backgroundRenderer,
    setBackgroundRenderer,
  });

  // 使用自定义右键菜单
  useCustomContextMenu(playerMenuItems);

  // 计算 profileId
  const profileId = isMobile ? "playerMobile" : isWidget ? "playerWidget" : "player";

  // 处理 settings 变化
  const handleSettingsChange = useCallback((newSettings: SettingsLyric) => {
    setSettings(newSettings);
  }, []);

  // 当 coverUrl 变化时，转换为 Base64
  useEffect(() => {
    if (coverUrl) {
      fetchCoverBase64(coverUrl).then((base64) => {
        if (base64) {
          setCoverBase64(base64);
        }
      });
    } else {
      setCoverBase64(undefined);
    }
  }, [coverUrl]);

  useEffect(() => {
    setVideoUrl(null);

    if (!title) return;

    const abortController = new AbortController();

    const fetchVideoUrl = async () => {
      try {
        const response = await fetch("/api/cover/videoUrl", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            songTitle: title,
            songAuthor: author,
          }),
          signal: abortController.signal,
        });

        const result = await response.text();

        if (result && result.trim() !== "" && result !== "null") {
          const cleanUrl = result.trim().replace(/^["']|["']$/g, '');
          if (cleanUrl) {
            setVideoUrl(cleanUrl);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch video URL:", error);
      }
    };

    fetchVideoUrl();

    return () => {
      abortController.abort();
    };
  }, [title]);

  // 动画帧循环：从 LyricView ref 获取 currentTime 更新进度条
  useEffect(() => {
    let rafId: number;

    const frame = () => {
      if (lyricViewRef.current) {
        setDisplayTime(lyricViewRef.current.getCurrentTime());
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  useLayoutEffect(() => {
    // 如果是水平布局，则让歌词对齐到封面的中心
    if (!isVertical && coverRef.current && lyricLayoutRef.current) {
      // 立即计算一次初始位置
      const calculatePosition = () => {
        if (!coverRef.current || !lyricLayoutRef.current) return;

        const coverB = coverRef.current.getBoundingClientRect();
        const layoutB = lyricLayoutRef.current.getBoundingClientRect();

        // 计算公式：(封面顶部位置 + 封面高度的一半 - 歌词容器顶部位置) / 歌词容器高度
        const newPosition = (coverB.top + coverB.height / 2 - layoutB.top) / layoutB.height;
        const clamped = Math.min(1, Math.max(0, newPosition));

        setAlignPosition(clamped);
      };

      // 立即执行一次
      calculatePosition();

      const obz = new ResizeObserver(() => {
        // 使用 requestAnimationFrame 确保在下一帧前计算新位置
        // 这有助于与 LyricPlayer 内部的动画系统同步
        requestAnimationFrame(calculatePosition);
      });

      obz.observe(coverRef.current);
      obz.observe(lyricLayoutRef.current);

      // 设置对齐锚点为 center
      setAlignAnchor("center");

      return () => obz.disconnect();
    }

    // 如果是垂直布局，则把歌词对齐到顶部（歌曲信息下方）
    if (isVertical) {
      setAlignPosition(0.02);
      setAlignAnchor("top");
    }
  }, [isVertical]);

  // 组件强制背景透明
  useEffect(() => {
    document.documentElement.classList.add("widget-transparent");
    return () => document.documentElement.classList.remove("widget-transparent");
  }, []);

  // 让 LyricPlayer "二次挂载"以重算内部布局
  useEffect(() => {
    // 等待 DOM 完成布局 -> 下一帧再测量更稳
    let raf1 = 0;
    let raf2 = 0;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setLyricRemountKey((k) => k + 1);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [isVertical]);

  // 获取 fontFamilyStyle（从 LyricView ref）
  const getFontFamilyStyle = () => {
    return lyricViewRef.current?.getFontFamilyStyle() ?? "";
  };

  // 垂直布局渲染
  if (isVertical) {
    return (
      <>
        {isDesktop && !isWidget && <TitleBar autoHide={true} />}

        <AutoHideCursor idleMs={5000} target="body" />

        <div
          id="player-container"
          className="absolute isolate w-full h-full overflow-hidden"
          style={{
            opacity: settings.opacity,
            filter: `brightness(${settings.brightness}) contrast(${settings.contrast}) saturate(${settings.saturate})`,
          }}
        >
          {settings.backgroundEnabled && (
            <BackgroundRender
              className="absolute inset-0 z-0"
              album={coverBase64}
              renderer={backgroundRenderer === "PixiRenderer" ? PixiRenderer : MeshGradientRenderer}
            />
          )}
          <div className="absolute top-0 left-0 flex flex-col w-full h-full">
            {/* 顶部：歌曲基本信息 */}
            <div className="flex-none">
              <VerticalSongInfo
                coverBase64={coverBase64}
                title={title}
                author={author}
                videoUrl={videoUrl}
                fontFamilyStyle={getFontFamilyStyle()}
              />
            </div>

            {/* 中间：滚动歌词 */}
            <div
              id="vertical-lyric-player-wrapper"
              className="flex-1 min-h-0"
              style={{
                mixBlendMode: "plus-lighter",
                paddingLeft: "16px",
                paddingRight: "16px",
                contain: "paint",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 4%, black 90%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 4%, black 90%, transparent 100%)",
              }}
            >
              <motion.div
                className="w-full h-full"
                animate={{
                  opacity: showLyric ? 1 : 0,
                  y: showLyric ? 0 : 24,
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                style={{ pointerEvents: showLyric ? "auto" : "none" }}
              >
                <LyricView
                  ref={lyricViewRef}
                  profileId={profileId}
                  alignPosition={alignPosition}
                  alignAnchor={alignAnchor}
                  lyricRemountKey={lyricRemountKey}
                  isMobile={isMobile}
                  isVerticalLayout={true}
                  className="w-full h-full"
                  onSettingsChange={handleSettingsChange}
                />
              </motion.div>
            </div>

            {/* 底部：进度条 */}
            <div className="flex-none">
              <VerticalProgressControl
                currentTime={displayTime}
                duration={duration}
                fontFamilyStyle={getFontFamilyStyle()}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  // 水平布局渲染
  return (
    <>
      {isDesktop && !isWidget && <TitleBar autoHide={true} />}

      <AutoHideCursor idleMs={5000} target="body" />

      <div
        id="player-container"
        className="absolute isolate w-full h-full overflow-hidden"
        style={{
          opacity: settings.opacity,
          filter: `brightness(${settings.brightness}) contrast(${settings.contrast}) saturate(${settings.saturate})`,
        }}
      >
        {settings.backgroundEnabled && (
          <BackgroundRender
            className="absolute inset-0 z-0"
            album={coverBase64}
            renderer={backgroundRenderer === "PixiRenderer" ? PixiRenderer : MeshGradientRenderer}
          />
        )}
        <div className="absolute top-0 left-0 flex w-full h-full">
          <motion.div
            aria-hidden
            className="h-full flex-none"
            style={{ flexBasis: 0 }}
            animate={{ flexGrow: showLyric ? 0 : 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 26 }}
          />
          <motion.div
            layout
            id="left-panel"
            className="h-full flex flex-col justify-center items-center flex-none"
            style={{
              width: "min(clamp(30%, 42vw, 90%), 90vh)",
            }}
            transition={{ type: "spring", stiffness: 120, damping: 26 }}
          >
            <SongInfo
              coverRef={coverRef}
              coverBase64={coverBase64}
              title={title}
              author={author}
              videoUrl={videoUrl}
              fontFamilyStyle={getFontFamilyStyle()}
            />
            <ProgressControl
              currentTime={displayTime}
              duration={duration}
              fontFamilyStyle={getFontFamilyStyle()}
            />
          </motion.div>
          <motion.div
            ref={lyricLayoutRef}
            id="lyric-player-wrapper"
            className="h-full flex-1 min-w-0"
            style={{
              mixBlendMode: "plus-lighter",
              paddingRight: "4%",
              contain: "paint",
              maskImage: "linear-gradient(transparent, black 10%, black 90%, transparent)",
              WebkitMaskImage: "linear-gradient(transparent, black 10%, black 90%, transparent)",
            }}
            animate={{
              opacity: showLyric ? 1 : 0,
              x: showLyric ? 0 : 24,
            }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div
              className="w-full h-full"
              style={{ pointerEvents: showLyric ? "auto" : "none" }}
            >
              <LyricView
                className="w-full h-full"
                ref={lyricViewRef}
                profileId={profileId}
                alignPosition={alignPosition}
                alignAnchor={alignAnchor}
                lyricRemountKey={lyricRemountKey}
                isMobile={isMobile}
                isVerticalLayout={false}
                onSettingsChange={handleSettingsChange}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
