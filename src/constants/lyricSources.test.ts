import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS_LYRIC_COMMON } from "../types/backend/settingsLyricCommon";

import { LYRIC_SOURCES } from "./lyricSources";

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
      widthClass: "w-[100px]",
    });
  });

  it("keeps Netease as the default source", () => {
    expect(DEFAULT_SETTINGS_LYRIC_COMMON.lyricSource).toBe("netease");
  });
});
