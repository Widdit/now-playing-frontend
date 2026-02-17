import React, { useState, useEffect } from "react";
import { LyricPlayer } from "@applemusic-like-lyrics/react";
import { parseLrc } from "@applemusic-like-lyrics/lyric";
import { type LyricLine } from "@applemusic-like-lyrics/core";

function getPageLoadTime() {
  const loadStart = performance.timing.navigationStart;
  const currentTime = performance.now() + loadStart;
  const loadTimeInSeconds = ((currentTime - loadStart) / 1000).toFixed(2);

  return parseFloat(loadTimeInSeconds);
}

export default function LyricPage() {
  const [currentTime, setCurrentTime] = useState(0);
  const [lyricLines, setLyricLines] = useState<LyricLine[]>([]);

  useEffect(() => {
    // 解析歌词
    const parsedResult = parseLrc(
      "[00:00.00]星光点亮了夜空的寂寞\n" +
        "[00:05.50]微风吹过带走所有烦忧\n" +
        "[00:11.30]月光洒满这安静的街头\n" +
        "[00:17.10]回忆悄悄爬上我的心头\n" +
        "[00:22.80]时光匆匆带不走曾经拥有",
    );

    const parsedLyricLines = parsedResult.map((line: any) => ({
      ...line,
      words: Array.isArray(line.words)
        ? line.words.map((word: any) => ({
          ...word,
          obscene: typeof word.obscene === "boolean" ? word.obscene : false,
        }))
        : [],
    }));

    setLyricLines(parsedLyricLines);
  }, []);

  useEffect(() => {
    let lastTime = -1;
    let rafId: number;

    const frame = (time: number) => {
      if (lastTime === -1) {
        lastTime = time;
      }

      // 如果歌曲没有暂停，这里先用 true 占位
      if (true) {
        const t = (getPageLoadTime() * 1000) | 0;

        setCurrentTime(t);
      }

      lastTime = time;
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    // 清理函数，组件卸载时停止动画
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="w-full h-full overflow-hidden" id="player-container">
      <LyricPlayer
        className="w-full h-full"
        currentTime={currentTime} // 逐帧更新播放时间
        lyricLines={lyricLines} // 设置歌词
      />
    </div>
  );
}
