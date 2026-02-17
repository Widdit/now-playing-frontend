// Lyric.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { BackgroundRender } from "@applemusic-like-lyrics/react";
import { MeshGradientRenderer, PixiRenderer } from "@applemusic-like-lyrics/core";
import { SettingsLyric, DEFAULT_SETTINGS_LYRIC } from "@/types/backend/settingsLyric";
import { coverUrlAtom } from "@/atoms/playerAtoms";
import { fetchCoverBase64 } from "@/services/playerService";
import { LyricView } from "@/components/LyricView";
import "@applemusic-like-lyrics/core/style.css";

export default function LyricPage() {
  const { profileId } = useParams();
  const navigate = useNavigate();

  // settings 状态（从 LyricView 回调获取）
  const [settings, setSettings] = useState<SettingsLyric>(DEFAULT_SETTINGS_LYRIC);

  const coverUrl = useAtomValue(coverUrlAtom);
  const [coverBase64, setCoverBase64] = useState<string | undefined>();

  // 组件强制背景透明
  useEffect(() => {
    document.documentElement.classList.add("widget-transparent");
    return () => document.documentElement.classList.remove("widget-transparent");
  }, []);

  // 路由验证
  useEffect(() => {
    // 允许访问的 profile 集合
    const allowed = new Set([
      "main",
      "profileA",
      "profileB",
      "profileC",
      "profileD",
      "player",
      "playerMobile",
      "playerWidget"
    ]);

    if (profileId && !allowed.has(profileId)) {
      navigate("/404", { replace: true });

      return;
    }
  }, [profileId, navigate]);

  // 当 coverUrl 变化时，转换为 Base64
  useEffect(() => {
    if (!settings.backgroundEnabled) {
      setCoverBase64(undefined);

      return;
    }

    if (coverUrl) {
      fetchCoverBase64(coverUrl).then((base64) => {
        if (base64) {
          setCoverBase64(base64);
        }
      });
    } else {
      setCoverBase64(undefined);
    }
  }, [coverUrl, settings.backgroundEnabled]);

  // 处理 settings 变化
  const handleSettingsChange = useCallback((newSettings: SettingsLyric) => {
    setSettings(newSettings);
  }, []);

  return (
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
          renderer={settings.backgroundRenderer === "PixiRenderer" ? PixiRenderer : MeshGradientRenderer}
        />
      )}
      <div className="absolute top-0 left-0 w-full h-full">
        <div
          id="lyric-player-wrapper"
          className="w-full h-full"
          style={{
            mixBlendMode: "plus-lighter",
            paddingRight: "4%",
            contain: "paint",
            maskImage: "linear-gradient(transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage: "linear-gradient(transparent, black 10%, black 90%, transparent)",
          }}
        >
          <LyricView
            className="w-full h-full"
            profileId={profileId}
            alignPosition={settings.alignPosition}
            alignAnchor="center"
            onSettingsChange={handleSettingsChange}
          />
        </div>
      </div>
    </div>
  );
}
