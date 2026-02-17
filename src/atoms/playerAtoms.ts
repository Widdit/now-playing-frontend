import { atom } from "jotai";
import type { LyricLine } from "@applemusic-like-lyrics/core";

// 歌曲信息 Atom
export const titleAtom = atom<string>("");
export const authorAtom = atom<string>("");
export const coverUrlAtom = atom<string>("");
export const durationAtom = atom<number>(0);
export const albumAtom = atom<string>("");

// 歌词数据 Atom
export const lyricSourceAtom = atom<string>("");
export const hasLyricAtom = atom<boolean>(false);
export const hasTranslatedLyricAtom = atom<boolean>(false);
export const hasKaraokeLyricAtom = atom<boolean>(false);
export const lrcAtom = atom<string>("");
export const translatedLyricRawAtom = atom<string>("");
export const karaokeLyricAtom = atom<string>("");

// 解析后的歌词行 Atom
export const lyricLinesAtom = atom<LyricLine[]>([]);

// 播放器状态 Atom
export const isPausedAtom = atom<boolean>(false);
export const progressAtom = atom<number>(0);
