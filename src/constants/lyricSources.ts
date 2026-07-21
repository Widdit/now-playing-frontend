export const LYRIC_SOURCE_TAB_CLASS =
  "h-8.5 min-w-0 flex-1 px-1 2xl:w-auto 2xl:flex-none 2xl:px-3";

export const LYRIC_SOURCES = [
  {
    key: "netease",
    label: "网易云音乐",
    icon: "/assets/netease_icon.png",
    widthClass: "w-auto 2xl:w-[100px]",
  },
  {
    key: "qq",
    label: "QQ音乐",
    icon: "/assets/qq_icon.png",
    widthClass: "w-auto 2xl:w-[80px]",
  },
  {
    key: "kugou",
    label: "酷狗音乐",
    icon: "/assets/kugou_icon.png",
    widthClass: "w-auto 2xl:w-[100px]",
  },
] as const;
