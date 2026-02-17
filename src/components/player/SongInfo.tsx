import React, { useState, useEffect, useRef, memo } from "react";
import { DynamicCover } from "@/components/player/DynamicCover";

export interface SongInfoProps {
  coverBase64: string | undefined;
  title: string;
  author: string;
  videoUrl: string | null;
  fontFamilyStyle?: string | undefined;
  coverRef: React.RefObject<HTMLDivElement | null>;
}

// 水平布局的歌曲信息组件
export const SongInfo = memo(({
                                coverBase64,
                                title,
                                author,
                                videoUrl,
                                fontFamilyStyle,
                                coverRef,
                              }: SongInfoProps) => {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isTitleOverflow, setIsTitleOverflow] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [scrollDuration, setScrollDuration] = useState(10);

  const titleTextRef = useRef<HTMLSpanElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);

  // 两个滚动标题之间的间距（像素）
  const gap = 50;

  useEffect(() => {
    setIsVideoReady(false);
  }, [videoUrl]);

  const handleVideoReady = () => {
    setIsVideoReady(true);
  };

  // 检测标题是否溢出并计算滚动参数
  useEffect(() => {
    const checkOverflow = () => {
      requestAnimationFrame(() => {
        if (titleTextRef.current && titleContainerRef.current) {
          const textWidth = titleTextRef.current.scrollWidth;
          const containerWidth = titleContainerRef.current.clientWidth;
          const isOverflowing = textWidth > containerWidth;

          setIsTitleOverflow(isOverflowing);

          if (isOverflowing) {
            const distance = textWidth + gap;
            setScrollDistance(distance);
            // 滚动速度：每秒 32 像素，最少 5 秒
            const duration = Math.max(distance / 32, 5);
            setScrollDuration(duration);
          } else {
            setScrollDistance(0);
            setScrollDuration(10);
          }
        }
      });
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [title, gap]);

  // 动态生成动画名称，确保 scrollDistance 变化时动画能正确更新
  const animationName = `scroll-title-${Math.round(scrollDistance)}`;

  return (
    <>
      {/* 动态生成滚动动画的 keyframes */}
      {isTitleOverflow && (
        <style>
          {`
            @keyframes ${animationName} {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-${scrollDistance}px);
              }
            }
          `}
        </style>
      )}

      {/* 封面 */}
      <div
        id="cover-wrapper"
        className="flex justify-center items-center w-full select-none"
      >
        <div
          ref={coverRef}
          style={{
            position: "relative",
            width: "min(100%, clamp(180px, 28vw, 500px), 52vh)",
          }}
        >
          <img
            id="cover"
            src={coverBase64}
            style={{
              "--base-box-shadow-v-0": "#00000030",
              "--base-box-shadow-y-0": "1em",
              "--base-box-shadow-r-0": "1.2em",
              width: "100%",
              height: "auto",
              borderRadius: 10,
              pointerEvents: "none",
              transition: "all 300ms ease",
              filter: `drop-shadow(var(--base-box-shadow-v-0) 0px var(--base-box-shadow-y-0) var(--base-box-shadow-r-0))`,
            } as React.CSSProperties}
          />
          {videoUrl && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                borderRadius: 10,
                overflow: "hidden",
                opacity: isVideoReady ? 1 : 0,
                transition: "opacity 300ms ease",
              }}
            >
              <DynamicCover videoUrl={videoUrl} onReady={handleVideoReady} />
            </div>
          )}
        </div>
      </div>

      {/* 歌名和歌手名 */}
      <div
        id="basic-info"
        className="flex flex-col gap-[2px] justify-start select-none"
        style={{
          width: "min(100%, clamp(180px, 28vw, 500px), 52vh)",
          transition: "opacity 300ms ease, filter 300ms ease",
          mixBlendMode: "plus-lighter",
          fontFamily: fontFamilyStyle,
          marginTop: "min(clamp(16px, 2.6vw, 40px), clamp(16px, 4vh, 40px))",
          position: "relative",
          zIndex: 2,
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
          willChange: "transform",
        }}
      >
        {/* 歌名容器 - 带渐变遮罩和滚动效果 */}
        <div
          ref={titleContainerRef}
          style={{
            overflow: "hidden",
            whiteSpace: "nowrap",
            position: "relative",
            // 仅在溢出时添加渐变遮罩
            ...(isTitleOverflow ? {
              maskImage: "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
            } : {}),
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              // 仅在溢出时添加滚动动画
              ...(isTitleOverflow ? {
                animation: `${animationName} ${scrollDuration}s linear infinite`,
              } : {}),
            }}
          >
            {/* 第一个标题（用于测量和显示） */}
            <span
              ref={titleTextRef}
              id="title"
              style={{
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: "max(2.4vh, 1.2em)",
                lineHeight: "max(2.4vh, 1.2em)",
                transition: "color 300ms ease, opacity 300ms ease, font-size 200ms ease",
                flexShrink: 0,
              }}
            >
              {title}
            </span>

            {/* 溢出时复制标题以实现无缝滚动 */}
            {isTitleOverflow && (
              <>
                {/* 间距 */}
                <span
                  style={{ width: `${gap}px`, flexShrink: 0 }}
                  aria-hidden="true"
                />
                {/* 复制的标题 */}
                <span
                  aria-hidden="true"
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "max(2.4vh, 1.2em)",
                    lineHeight: "max(2.4vh, 1.2em)",
                    flexShrink: 0,
                  }}
                >
                  {title}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 歌手名 - 超出显示省略号 */}
        <span
          id="author"
          style={{
            display: "block",
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "max(2.3vh, 1.1em)",
            lineHeight: "max(2.3vh, 1.1em)",
            transition: "color 300ms ease, opacity 300ms ease, font-size 200ms ease",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {author}
        </span>
      </div>
    </>
  );
});

export interface VerticalSongInfoProps {
  coverBase64: string | undefined;
  title: string;
  author: string;
  videoUrl: string | null;
  fontFamilyStyle?: string | undefined;
}

// 垂直布局的歌曲信息组件
export const VerticalSongInfo = memo(({
                                        coverBase64,
                                        title,
                                        author,
                                        videoUrl,
                                        fontFamilyStyle,
                                      }: VerticalSongInfoProps) => {
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    setIsVideoReady(false);
  }, [videoUrl]);

  const handleVideoReady = () => {
    setIsVideoReady(true);
  };

  return (
    <div
      id="vertical-song-info"
      className="flex items-center select-none w-full"
    >
      {/* 封面 */}
      <div
        id="vertical-cover-wrapper"
        style={{
          position: "relative",
          flexShrink: 0,
        }}
      >
        {coverBase64 ? (
          <img
            id="vertical-cover"
            src={coverBase64}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 8,
              display: "block",
              objectFit: "cover",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          />
        ) : null}
        {videoUrl && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              borderRadius: 8,
              overflow: "hidden",
              opacity: isVideoReady ? 1 : 0,
              transition: "opacity 300ms ease",
            }}
          >
            <DynamicCover videoUrl={videoUrl} onReady={handleVideoReady} />
          </div>
        )}
      </div>

      {/* 歌名和歌手名 */}
      <div
        id="vertical-basic-info"
        className="flex flex-col gap-1 min-w-0 flex-1"
        style={{
          fontFamily: fontFamilyStyle,
          mixBlendMode: "plus-lighter",
          position: "relative",
          zIndex: 2,
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
          willChange: "transform",
        }}
      >
        <span
          id="vertical-title"
          style={{
            color: "rgba(255, 255, 255, 0.8)",
            lineHeight: "1.2",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </span>
        <span
          id="vertical-author"
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            lineHeight: "1.2",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {author}
        </span>
      </div>
    </div>
  );
});
