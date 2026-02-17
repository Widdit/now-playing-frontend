export interface SettingsLyricCommon {
  lyricSource: string;
  autoSelectBestLyric: boolean;
}

export const DEFAULT_SETTINGS_LYRIC_COMMON: SettingsLyricCommon = {
  lyricSource: "netease",
  autoSelectBestLyric: true,
};
