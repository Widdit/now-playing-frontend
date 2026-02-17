export interface SettingsLyric {
  lastUpdateTime: number;
  primaryFont: string;
  fallbackFont: string;
  fontSize: string;
  letterSpacing: number;
  boldEnabled: boolean;
  shadowEnabled: boolean;
  shadowXOffset: number;
  shadowYOffset: number;
  shadowBlur: number;
  shadowColor: string;
  strokeEnabled: boolean;
  strokeColor: string;
  alignPosition: number;
  hidePassedLines: boolean;
  backgroundEnabled: boolean;
  backgroundRenderer: string;
  color: string;
  blurEffectEnabled: boolean;
  scaleEffectEnabled: boolean;
  springAnimationEnabled: boolean;
  textAlign: string;
  interludeDotsPosition: number;
  showTranslation: boolean;
  subLineFontSize: number;
  karaokeLyricEnabled: boolean;
  timeOffset: number;
  showTitleWhenNoLyric: boolean;
  noLyricText: string;
  opacity: number;
  brightness: number;
  contrast: number;
  saturate: number;
  translateX: number;
  translateY: number;
  perspective: number;
  rotateX: number;
  rotateY: number;
}

export const DEFAULT_SETTINGS_LYRIC: SettingsLyric = {
  lastUpdateTime: 0,
  primaryFont: "MicrosoftYaHei",
  fallbackFont: "MicrosoftYaHei",
  fontSize: "medium",
  letterSpacing: 0,
  boldEnabled: false,
  shadowEnabled: false,
  shadowXOffset: 2,
  shadowYOffset: 2,
  shadowBlur: 3,
  shadowColor: "rgba(17, 255, 255, 0.9)",
  strokeEnabled: false,
  strokeColor: "rgba(163, 99, 217, 1)",
  alignPosition: 0.5,
  hidePassedLines: false,
  backgroundEnabled: true,
  backgroundRenderer: "MeshGradientRenderer",
  color: "rgba(255, 255, 255, 1)",
  blurEffectEnabled: true,
  scaleEffectEnabled: true,
  springAnimationEnabled: true,
  textAlign: "left",
  interludeDotsPosition: 0,
  showTranslation: true,
  subLineFontSize: 0.5,
  karaokeLyricEnabled: true,
  timeOffset: 0,
  showTitleWhenNoLyric: false,
  noLyricText: "纯音乐，请欣赏",
  opacity: 1.0,
  brightness: 1.0,
  contrast: 1.0,
  saturate: 1.0,
  translateX: 0,
  translateY: 0,
  perspective: 800,
  rotateX: 0,
  rotateY: 0,
};
