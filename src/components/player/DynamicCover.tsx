import React, { useEffect, useRef, memo } from "react";
import Hls from "hls.js";

interface DynamicCoverProps {
  videoUrl: string;
  onReady?: () => void;
}

// 动态封面组件
export const DynamicCover = memo(({ videoUrl, onReady }: DynamicCoverProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((err) => {
          console.warn("Video autoplay failed:", err);
        });
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error("HLS fatal error:", data);
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch((err) => {
          console.warn("Video autoplay failed:", err);
        });
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);

  const handleCanPlay = () => {
    onReady?.();
  };

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      autoPlay
      onCanPlay={handleCanPlay}
      style={{
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
        objectFit: "cover",
      } as React.CSSProperties}
    />
  );
});
