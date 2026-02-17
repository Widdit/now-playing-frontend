import React, { useState, useMemo, memo } from "react";

export interface ProgressControlProps {
  currentTime: number;
  duration: number;
  fontFamilyStyle?: string | undefined;
}

// 水平布局的进度条组件
export const ProgressControl = memo(({
                                       currentTime,
                                       duration,
                                       fontFamilyStyle,
                                     }: ProgressControlProps) => {
  const [showTotalDuration, setShowTotalDuration] = useState(false);

  const currentSeconds = Math.floor(currentTime / 1000);

  const playedTimeDisplay = useMemo(() => {
    const mins = Math.floor(currentSeconds / 60);
    const secs = currentSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [currentSeconds]);

  const remainingTimeDisplay = useMemo(() => {
    const remaining = Math.max(0, Math.ceil(duration - currentSeconds));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `-${mins}:${secs.toString().padStart(2, '0')}`;
  }, [currentSeconds, duration]);

  const totalTimeDisplay = useMemo(() => {
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [duration]);

  const progressPercent = duration > 0
    ? Math.min(100, Number(((currentTime / 1000 / duration) * 100).toFixed(1)))
    : 0;

  return (
    <div
      id="progress-wrapper"
      className="flex flex-col gap-[6px]"
      style={{
        width: "min(100%, clamp(180px, 28vw, 500px), 52vh)",
        mixBlendMode: "plus-lighter",
        marginTop: "min(clamp(12px, 2vw, 28px), clamp(12px, 3vh, 28px))",
        position: "relative",
        zIndex: 2,
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      <div
        id="progress-bar-wrapper"
        className="w-full flex items-center"
        style={{ height: "16px" }}
      >
        <div
          id="progress-bar"
          className="w-full rounded-full overflow-hidden"
          style={{
            height: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            transition: "height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.height = "16px"; }}
          onMouseLeave={(e) => { e.currentTarget.style.height = "8px"; }}
        >
          <div
            id="progress-bar-played"
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              overflow: "hidden",
              borderTopLeftRadius: "999px",
              borderBottomLeftRadius: "999px",
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}
          >
            <div
              style={{
                width: "calc(100% + 100px)",
                height: "100%",
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                borderRadius: "999px",
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="flex justify-between select-none"
        style={{
          fontFamily: fontFamilyStyle,
        }}
      >
        <span
          id="played-time"
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "max(1.2vh, 0.8em)",
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
            transition: "color 300ms ease, opacity 300ms ease, font-size 200ms ease",
          }}
        >
          {playedTimeDisplay}
        </span>
        <span
          id="remaining-time"
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "max(1.2vh, 0.8em)",
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
            transition: "color 300ms ease, opacity 300ms ease, font-size 200ms ease",
            cursor: "pointer",
          }}
          onClick={() => setShowTotalDuration((prev) => !prev)}
        >
          {showTotalDuration ? totalTimeDisplay : remainingTimeDisplay}
        </span>
      </div>
    </div>
  );
});

export interface VerticalProgressControlProps {
  currentTime: number;
  duration: number;
  fontFamilyStyle?: string | undefined;
}

// 垂直布局的进度条组件
export const VerticalProgressControl = memo(({
                                               currentTime,
                                               duration,
                                               fontFamilyStyle,
                                             }: VerticalProgressControlProps) => {
  const [showTotalDuration, setShowTotalDuration] = useState(false);

  const currentSeconds = Math.floor(currentTime / 1000);

  const playedTimeDisplay = useMemo(() => {
    const mins = Math.floor(currentSeconds / 60);
    const secs = currentSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [currentSeconds]);

  const remainingTimeDisplay = useMemo(() => {
    const remaining = Math.max(0, Math.ceil(duration - currentSeconds));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `-${mins}:${secs.toString().padStart(2, '0')}`;
  }, [currentSeconds, duration]);

  const totalTimeDisplay = useMemo(() => {
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [duration]);

  const progressPercent = duration > 0
    ? Math.min(100, Number(((currentTime / 1000 / duration) * 100).toFixed(1)))
    : 0;

  return (
    <div
      id="vertical-progress-wrapper"
      className="flex flex-col gap-[4px] w-full"
      style={{
        mixBlendMode: "plus-lighter",
        position: "relative",
        zIndex: 2,
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      <div
        id="vertical-progress-bar-wrapper"
        className="w-full flex items-center"
        style={{
          height: "16px",
        }}
      >
        <div
          id="vertical-progress-bar"
          className="w-full rounded-full overflow-hidden"
          style={{
            height: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            transition: "height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.height = "16px"; }}
          onMouseLeave={(e) => { e.currentTarget.style.height = "8px"; }}
        >
          <div
            id="vertical-progress-bar-played"
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              overflow: "hidden",
              borderTopLeftRadius: "999px",
              borderBottomLeftRadius: "999px",
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}
          >
            <div
              style={{
                width: "calc(100% + 100px)",
                height: "100%",
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                borderRadius: "999px",
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="flex justify-between select-none"
        style={{
          fontFamily: fontFamilyStyle,
        }}
      >
        <span
          id="vertical-played-time"
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "0.9em",
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {playedTimeDisplay}
        </span>
        <span
          id="vertical-remaining-time"
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "0.9em",
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
            cursor: "pointer",
          }}
          onClick={() => setShowTotalDuration((prev) => !prev)}
        >
          {showTotalDuration ? totalTimeDisplay : remainingTimeDisplay}
        </span>
      </div>
    </div>
  );
});
