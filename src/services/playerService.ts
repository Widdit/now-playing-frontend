import { getDefaultStore } from "jotai";
import type { LyricLine as CoreLyricLine } from "@applemusic-like-lyrics/core";
import {
  type LyricLine,
  parseLrc,
  parseQrc,
  parseYrc,
} from "@applemusic-like-lyrics/lyric";
import { SettingsLyric } from "@/types/backend/settingsLyric";
import { Timer } from "@/utils/timer";
import {
  titleAtom,
  authorAtom,
  coverUrlAtom,
  durationAtom,
  albumAtom,
  lyricLinesAtom,
  lyricSourceAtom,
  hasLyricAtom,
  hasTranslatedLyricAtom,
  hasKaraokeLyricAtom,
  lrcAtom,
  translatedLyricRawAtom,
  karaokeLyricAtom,
  isPausedAtom,
  progressAtom,
} from "@/atoms/playerAtoms";

const store = getDefaultStore();

let ws: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let timerRef: Timer | null = null;
let settingsRef: SettingsLyric | null = null;
const PROGRESS_COMPENSATION_MS = 140; // 用于补偿进度条延迟（即 Now Playing 的进度略慢于音乐软件的真实进度）

// ============ 歌词解析逻辑 ============

type TransLine = {
  [K in keyof CoreLyricLine]: CoreLyricLine[K] extends string ? K : never;
}[keyof CoreLyricLine];

function pairLyric(line: LyricLine, lines: CoreLyricLine[], key: TransLine) {
  if (
    line.words
      .map((v) => v.word)
      .join("")
      .trim().length === 0
  )
    return;
  interface PairedLine {
    startTime: number;
    lineText: string;
    origIndex: number;
    original: CoreLyricLine;
  }
  const processed: PairedLine[] = lines.map((v, i) => ({
    startTime: Math.min(v.startTime, ...v.words.map((v) => v.startTime)),
    origIndex: i,
    lineText: v.words
      .map((v) => v.word)
      .join("")
      .trim(),
    original: v,
  }));
  let nearestLine: PairedLine | undefined;

  for (const coreLine of processed) {
    if (coreLine.lineText.length > 0) {
      if (coreLine.startTime === line.words[0].startTime) {
        nearestLine = coreLine;
        break;
      }
      if (
        nearestLine &&
        Math.abs(nearestLine.startTime - line.words[0].startTime) >
        Math.abs(coreLine.startTime - line.words[0].startTime)
      ) {
        nearestLine = coreLine;
      } else if (nearestLine === undefined) {
        nearestLine = coreLine;
      }
    }
  }
  if (nearestLine) {
    const joined = line.words.map((w) => w.word).join("");

    if (nearestLine.original[key].length > 0)
      nearestLine.original[key] += joined;
    else nearestLine.original[key] = joined;
  }
}

/**
 * 从存储在 Atom 中的原始数据解析歌词
 */
function parseLyricLines(settings: SettingsLyric): CoreLyricLine[] {
  const noLyric: CoreLyricLine[] = [
    {
      words: [
        {
          word: settings.noLyricText,
          startTime: 0,
          endTime: Infinity,
          romanWord: "",
          obscene: false
        },
      ],
      startTime: 0,
      endTime: Infinity,
      translatedLyric: "",
      romanLyric: "",
      isBG: false,
      isDuet: false,
    },
  ];

  const source = store.get(lyricSourceAtom);
  const hasLyric = store.get(hasLyricAtom);
  const hasKaraokeLyric = store.get(hasKaraokeLyricAtom);
  const hasTranslatedLyric = store.get(hasTranslatedLyricAtom);
  const lrc = store.get(lrcAtom);
  const karaokeLyric = store.get(karaokeLyricAtom);
  const translatedLyricRaw = store.get(translatedLyricRawAtom);
  const title = store.get(titleAtom);
  const author = store.get(authorAtom);

  // 判断是否有歌词
  if (!hasLyric && !hasKaraokeLyric) {
    if (settings.showTitleWhenNoLyric && author && title) {
      noLyric[0].words[0].word = `${author} - ${title}`;
    }
    return noLyric;
  }

  let parsedLyricLines: LyricLine[] = [];

  try {
    // 判断是否有逐词歌词
    if (hasKaraokeLyric && settings.karaokeLyricEnabled) {
      if (source === "netease") {
        parsedLyricLines = parseYrc(karaokeLyric);
      } else if (source === "qq") {
        parsedLyricLines = parseQrc(karaokeLyric);
      }
    } else {
      parsedLyricLines = parseLrc(lrc);
    }

    const compatibleLyricLines: CoreLyricLine[] = parsedLyricLines.map(
      (line) => ({
        ...line,
        words: line.words.map((word) => ({
          ...word,
          obscene: false,
        })),
      }),
    );

    // 判断是否有翻译歌词
    if (hasTranslatedLyric) {
      try {
        const translatedLyricLines = parseLrc(translatedLyricRaw);

        for (const line of translatedLyricLines) {
          pairLyric(
            {
              ...line,
              words: line.words.map((word) => ({
                ...word,
                obscene: false,
              })),
            },
            compatibleLyricLines,
            "translatedLyric",
          );
        }
      } catch (err) {
        console.error("解析翻译歌词时出现错误：", err);
      }
    }

    const processedLyricLines: CoreLyricLine[] = compatibleLyricLines;

    // 不显示翻译歌词
    if (!settings.showTranslation) {
      for (const line of processedLyricLines) {
        line.translatedLyric = "";
      }
    }

    return processedLyricLines.map((line: any) => ({
      ...line,
      words: Array.isArray(line.words)
        ? line.words.map((word: any) => ({
          ...word,
          obscene: typeof word.obscene === "boolean" ? word.obscene : false,
        }))
        : [],
    }));
  } catch (error) {
    console.error("解析歌词失败：", error);
  }

  if (settings.showTitleWhenNoLyric && author && title) {
    noLyric[0].words[0].word = `${author} - ${title}`;
  }
  return noLyric;
}

/**
 * 根据当前的歌词数据和设置更新歌词行 Atom
 */
function updateLyricLinesAtom() {
  if (!settingsRef) return;
  const lines = parseLyricLines(settingsRef);
  store.set(lyricLinesAtom, lines);
}

// ============ WebSocket 事件处理器 ============

/**
 * 处理 Track 事件 - 歌曲切换
 */
function handleTrackEvent(data: any) {
  store.set(titleAtom, data.title || "");
  store.set(authorAtom, data.author || "");
  store.set(coverUrlAtom, data.cover || "");
  store.set(durationAtom, data.duration || 0);
  store.set(albumAtom, data.album || "");

  // 歌曲切换时重置并启动计时器
  if (timerRef) {
    timerRef.reset();
    timerRef.start();
  }
}

/**
 * 处理 Lyric 事件 - 歌词变更
 */
function handleLyricEvent(data: any) {
  store.set(lyricSourceAtom, data.source || "");
  store.set(hasLyricAtom, data.hasLyric || false);
  store.set(hasTranslatedLyricAtom, data.hasTranslatedLyric || false);
  store.set(hasKaraokeLyricAtom, data.hasKaraokeLyric || false);
  store.set(lrcAtom, data.lrc || "");
  store.set(translatedLyricRawAtom, data.translatedLyric || "");
  store.set(karaokeLyricAtom, data.karaokeLyric || "");

  // 使用当前设置重新解析歌词
  updateLyricLinesAtom();
}

/**
 * 处理 PlayerPauseState 事件 - 暂停状态变更
 */
function handlePlayerPauseStateEvent(data: any) {
  const newIsPaused = data.isPaused;
  store.set(isPausedAtom, newIsPaused);

  if (timerRef) {
    if (newIsPaused) {
      timerRef.pause();
    } else {
      timerRef.start();
    }
  }
}

/**
 * 处理 PlayerProgress 事件 - 同步播放进度
 */
function handlePlayerProgressEvent(data: any) {
  const progress = data.progress || 0;
  store.set(progressAtom, progress);

  if (timerRef) {
    timerRef.setTime(progress + PROGRESS_COMPENSATION_MS);
    // Ensure timer is running if not paused
    const isPaused = store.get(isPausedAtom);
    if (!isPaused) {
      timerRef.start();
    }
  }
}

/**
 * 处理 PlayerProgressReplay 事件 - 歌曲从头重播
 */
function handlePlayerProgressReplayEvent() {
  if (timerRef) {
    timerRef.reset();
    timerRef.start();
  }
}

/**
 * 处理 WebSocket 消息
 */
function handleMessage(event: MessageEvent) {
  try {
    const message = JSON.parse(event.data);
    const { event: eventType, data } = message;

    switch (eventType) {
      case "Track":
        handleTrackEvent(data);
        break;
      case "Lyric":
        handleLyricEvent(data);
        break;
      case "PlayerPauseState":
        handlePlayerPauseStateEvent(data);
        break;
      case "PlayerProgress":
        handlePlayerProgressEvent(data);
        break;
      case "PlayerProgressReplay":
        handlePlayerProgressReplayEvent();
        break;
      default:
        console.log(`Unknown WebSocket event type: ${eventType}`);
    }
  } catch (error) {
    console.error("Failed to parse WebSocket message:", error);
  }
}

/**
 * 连接到 WebSocket
 */
function connect() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/api/ws/lyric`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("WebSocket connected");
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };

  ws.onmessage = handleMessage;

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  ws.onclose = () => {
    console.log(
      "WebSocket disconnected, attempting to reconnect in 2 seconds...",
    );
    ws = null;
    reconnectTimeout = setTimeout(() => {
      connect();
    }, 2000);
  };
}

// ============ 公开接口 ============

/**
 * 使用计时器和设置初始化播放器服务
 * @param timer 来自 Lyric.tsx 的计时器实例
 * @param settings 当前的设置项
 */
export function initPlayerService(timer: Timer, settings: SettingsLyric) {
  timerRef = timer;
  settingsRef = settings;
  connect();
}

/**
 * 更新设置引用并重新解析歌词
 * @param settings 新的设置项
 */
export function updateSettings(settings: SettingsLyric) {
  settingsRef = settings;
  updateLyricLinesAtom();
}

/**
 * 断开 WebSocket 连接并清理资源
 */
export function disconnectPlayerService() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  timerRef = null;
  settingsRef = null;
}

/**
 * 获取封面图片并转换为 Base64 格式
 * @param coverUrl 封面图片的 URL
 * @returns Base64 编码的图片字符串
 */
export async function fetchCoverBase64(
  coverUrl: string,
): Promise<string | undefined> {
  try {
    const response = await fetch("/api/cover/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cover_url: coverUrl }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data.base64Img;
  } catch (error) {
    console.error("Fetch base64Image failed:", error);
  }
}
