import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS_LYRIC_COMMON } from "../types/backend/settingsLyricCommon";

import { LYRIC_SOURCES, LYRIC_SOURCE_TAB_CLASS } from "./lyricSources";

describe("LYRIC_SOURCES", () => {
  it("keeps source keys in a stable order", () => {
    expect(LYRIC_SOURCES.map((source) => source.key)).toEqual([
      "netease",
      "qq",
      "kugou",
    ]);
  });

  it("defines the Kugou source", () => {
    expect(LYRIC_SOURCES.find((source) => source.key === "kugou")).toEqual({
      key: "kugou",
      label: "酷狗音乐",
      icon: "/assets/kugou_icon.png",
      widthClass: "w-auto 2xl:w-[100px]",
    });
  });

  it("only applies fixed tab widths when the wide layout has enough room", () => {
    expect(LYRIC_SOURCES.map((source) => source.widthClass)).toEqual([
      "w-auto 2xl:w-[100px]",
      "w-auto 2xl:w-[80px]",
      "w-auto 2xl:w-[100px]",
    ]);
  });

  it("restores intrinsic tab widths when the wide layout has enough room", () => {
    expect(LYRIC_SOURCE_TAB_CLASS).toBe(
      "h-8.5 min-w-0 flex-1 px-1 2xl:w-auto 2xl:flex-none 2xl:px-3",
    );
  });

  it("keeps Netease as the default source", () => {
    expect(DEFAULT_SETTINGS_LYRIC_COMMON.lyricSource).toBe("netease");
  });
});
