// SettingsLyric.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button, ButtonGroup } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { NumberInput } from "@heroui/number-input";
import { Select, SelectItem, SelectSection } from "@heroui/select";
import { Slider } from "@heroui/slider";
import { Spacer } from "@heroui/spacer";
import { Switch } from "@heroui/switch";
import { Tabs, Tab } from "@heroui/tabs";
import { addToast } from "@heroui/toast";
import { Tooltip } from "@heroui/tooltip";
import { useDisclosure } from "@heroui/use-disclosure";
import { Link } from "@heroui/link";
import { Code } from "@heroui/code";

import {
  AArrowDown,
  AArrowUp,
  Delete,
} from "lucide-react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import type { OverlayScrollbarsComponentRef } from "overlayscrollbars-react";
import {
  InfoCircle,
  QuestionCircleSolid,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  TextJustify,
} from "@mynaui/icons-react";
import { twMerge } from "tailwind-merge";

import { ColorPalette } from "@/components/ColorPalette";
import { FontAutocomplete } from "@/components/FontAutocomplete";
import { RefreshCw } from "@/components/animate-icons/RefreshCw";
import { Advance50Icon, Delay50Icon, Reset0Icon  } from "@/components/TimeOffsetIcons";
import { refreshLocalFonts } from "@/contexts/FontContext";
import { LyricView } from "@/components/LyricView";
import { IntegrationCard } from "@/components/IntegrationCard";
import { useDebounce } from "@/hooks/useDebounce";
import { useOpenExternalUrl } from "@/hooks/useOpenExternalUrl";
import { SettingsLyric, DEFAULT_SETTINGS_LYRIC } from "@/types/backend/settingsLyric";
import { SettingsLyricCommon, DEFAULT_SETTINGS_LYRIC_COMMON } from "@/types/backend/settingsLyricCommon";
import { useAtomValue } from "jotai";
import { coverUrlAtom } from "@/atoms/playerAtoms";
import { fetchCoverBase64 } from "@/services/playerService";
import { BackgroundRender } from "@applemusic-like-lyrics/react";
import { MeshGradientRenderer, PixiRenderer } from "@applemusic-like-lyrics/core";
import "@applemusic-like-lyrics/core/style.css";

// 配置文件分组
const PROFILE_GROUPS = {
  lyricPage: ["main", "profileA", "profileB", "profileC", "profileD"],
  playerPage: ["player", "playerMobile", "playerWidget"],
};

// 配置文件名称
const PROFILE_MAP: Record<string, string> = {
  main: "主配置",
  profileA: "配置文件 A",
  profileB: "配置文件 B",
  profileC: "配置文件 C",
  profileD: "配置文件 D",
  player: "桌面播放器",
  playerMobile: "播放器（移动设备）",
  playerWidget: "播放器（桌面组件）",
};

// 字体大小选项
const FONT_SIZE_OPTIONS = new Map<string, string>([
  ["tiny", "最小"],
  ["extraSmall", "极小"],
  ["small", "较小"],
  ["medium", "中等"],
  ["large", "较大"],
  ["extraLarge", "极大"],
  ["huge", "最大"],
]);

const FONT_SIZE_KEYS = Array.from(FONT_SIZE_OPTIONS.keys());

export default function LyricSettingsPage() {
  const [settings, setSettings] = useState<SettingsLyric>(DEFAULT_SETTINGS_LYRIC);
  const debouncedSettings = useDebounce(settings, 1000);
  const skipSaveSettingsRef = useRef(true);

  const [settingsCommon, setSettingsCommon] = useState<SettingsLyricCommon>(DEFAULT_SETTINGS_LYRIC_COMMON);
  const skipSaveSettingsCommonRef = useRef(true);

  const coverUrl = useAtomValue(coverUrlAtom);
  const [coverBase64, setCoverBase64] = useState<string | undefined>();

  const [profileId, setProfileId] = useState<string>("main");
  const [previewBackground, setPreviewBackground] = useState<string>("grid");
  const [isFontRefresh1Hovered, setIsFontRefresh1Hovered] = useState(false);
  const [isFontRefresh1Spinning, setIsFontRefresh1Spinning] = useState(false);
  const [isFontRefresh2Hovered, setIsFontRefresh2Hovered] = useState(false);
  const [isFontRefresh2Spinning, setIsFontRefresh2Spinning] = useState(false);

  const { openExternalUrl } = useOpenExternalUrl();

  const {
    isOpen: isProfileHelpModalOpen,
    onOpen: onProfileHelpModalOpen,
    onOpenChange: onProfileHelpModalOpenChange,
  } = useDisclosure();

  const {
    isOpen: isResetProfileModalOpen,
    onOpen: onResetProfileModalOpen,
    onOpenChange: onResetProfileModalOpenChange,
  } = useDisclosure();

  const scrollRef = useRef<OverlayScrollbarsComponentRef<"div">>(null);

  // 跟踪滚动状态
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // 获取通用歌词设置
  useEffect(() => {
    const fetchSettingsCommon = async () => {
      try {
        const resp = await fetch("/api/lyric/settings/common");

        if (!resp.ok) {
          throw new Error(`HTTP 响应错误！状态码：${resp.status}`);
        }

        const data: SettingsLyricCommon = await resp.json();

        skipSaveSettingsCommonRef.current = true;
        setSettingsCommon(data);

      } catch (err : any) {
        console.error("通用歌词设置获取失败：", err);
        addToast({
          title: "通用歌词设置获取失败",
          description: err.message,
          color: "danger",
          timeout: 6000,
        });
      }
    };

    fetchSettingsCommon();
  }, []);

  // 获取歌词设置
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const resp = await fetch(`/api/lyric/settings?id=${encodeURIComponent(profileId)}`);

        if (!resp.ok) {
          throw new Error(`HTTP 响应错误！状态码：${resp.status}`);
        }

        const data: SettingsLyric = await resp.json();

        skipSaveSettingsRef.current = true;
        setSettings(data);

      } catch (err : any) {
        console.error("歌词设置获取失败：", err);
        addToast({
          title: "歌词设置获取失败",
          description: err.message,
          color: "danger",
          timeout: 6000,
        });
      }
    };

    fetchSettings();
  }, [profileId]);

  // 保存通用歌词设置
  useEffect(() => {
    if (skipSaveSettingsCommonRef.current) {
      skipSaveSettingsCommonRef.current = false;
      return;
    }

    const saveSettingsCommon = async () => {
      try {
        const resp = await fetch("/api/lyric/settings/common", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settingsCommon),
        });

        if (!resp.ok) {
          throw new Error(`HTTP 响应错误！状态码：${resp.status}`);
        }
      } catch (err : any) {
        console.error("通用歌词设置保存失败：", err);
        addToast({
          title: "通用歌词设置保存失败",
          description: err.message,
          color: "danger",
          timeout: 6000,
        });
      }
    };

    saveSettingsCommon();
  }, [settingsCommon]);

  // 保存歌词设置
  useEffect(() => {
    if (skipSaveSettingsRef.current) {
      skipSaveSettingsRef.current = false;
      return;
    }

    const saveSettings = async () => {
      try {
        const resp = await fetch(
          `/api/lyric/settings?id=${encodeURIComponent(profileId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(debouncedSettings),
          }
        );

        if (!resp.ok) {
          throw new Error(`HTTP 响应错误！状态码：${resp.status}`);
        }
      } catch (err: any) {
        console.error("歌词设置保存失败：", err);
        addToast({
          title: "歌词设置保存失败",
          description: err.message,
          color: "danger",
          timeout: 6000,
        });
      }
    };

    saveSettings();
  }, [debouncedSettings]);

  // 更新滚动状态
  const updateScrollState = useCallback(() => {
    const osInstance = scrollRef.current?.osInstance();

    if (osInstance) {
      const { viewport } = osInstance.elements();
      const { scrollTop, scrollHeight, clientHeight } = viewport;

      // 判断是否可以向上/向下滚动
      setCanScrollUp(scrollTop > 0);
      // 增加 1px 的容错
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 1);
    }
  }, []);

  // 生成 mask-image 样式
  const maskStyle = useMemo(() => {
    // 遮罩的高度（渐变区域的大小）
    const maskSize = "40px";

    // 如果都不需要滚动，不需要遮罩
    if (!canScrollUp && !canScrollDown) return {};

    // 构建线性渐变
    const gradient = `linear-gradient(to bottom,
      ${canScrollUp ? `transparent, black ${maskSize}` : "black 0"},
      ${canScrollDown ? `black calc(100% - ${maskSize}), transparent` : "black 100%"}
    )`;

    return {
      maskImage: gradient,
      WebkitMaskImage: gradient, // 兼容 Safari/Chrome
    };
  }, [canScrollUp, canScrollDown]);

  // 监听窗口大小变化
  useEffect(() => {
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState]);

  // 调整字体大小
  const adjustFontSize = (direction: "up" | "down") => {
    setSettings(prev => {
      const currentIndex = FONT_SIZE_KEYS.indexOf(prev.fontSize);

      if (currentIndex === -1) return prev;

      const newIndex = direction === "up"
        ? Math.min(currentIndex + 1, FONT_SIZE_KEYS.length - 1)
        : Math.max(currentIndex - 1, 0);

      if (newIndex === currentIndex) return prev;

      return { ...prev, fontSize: FONT_SIZE_KEYS[newIndex] };
    });
  };

  // 当 coverUrl 变化时，转换为 Base64
  useEffect(() => {
    if (!settings.backgroundEnabled) {
      setCoverBase64(undefined);

      return;
    }

    if (coverUrl) {
      fetchCoverBase64(coverUrl).then((base64) => {
        if (base64) {
          setCoverBase64(base64);
        }
      });
    } else {
      setCoverBase64(undefined);
    }
  }, [coverUrl, settings.backgroundEnabled]);

  return (
    <div className="px-10 md:px-7 py-6 md:h-full md:overflow-hidden">
      <div className="flex flex-col md:flex-row gap-5 md:h-full mx-auto max-w-[1600px]">
        {/* 左侧 - 歌词设置 */}
        <div className="w-full md:w-1/2 max-w-[720px] flex flex-col md:h-full font-poppins">
          <OverlayScrollbarsComponent
            ref={scrollRef}
            className="w-full md:h-full"
            style={maskStyle}
            options={{
              scrollbars: {
                autoHide: "leave",
                autoHideDelay: 500,
                theme: "os-theme-dark",
              },
              overflow: {
                x: "hidden",
                y: "scroll",
              },
            }}
            events={{
              scroll: updateScrollState,
              initialized: updateScrollState,
            }}
            defer
          >
            <div className="flex flex-col gap-6 md:pl-1 md:pr-8">
              <h1 className="text-3xl text-white font-bold leading-9">歌词组件</h1>

              {/* 通用设置 */}
              <div className="flex flex-col gap-4">
                <h1 className="text-xl text-default-800 font-bold leading-9">
                  通用设置
                </h1>

                {/* 歌词源 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>歌词源</span>
                    <span className="text-color-desc text-sm">
                      选定歌词获取来源
                    </span>
                  </div>
                  <Tabs
                    classNames={{
                      tabList: "p-1",
                      tab: "h-8.5",
                      tabContent: "text-default-600",
                    }}
                    color="primary"
                    radius="lg"
                    selectedKey={settingsCommon.lyricSource}
                    onSelectionChange={(key) => {
                      setSettingsCommon(prev => ({ ...prev, lyricSource: String(key) }));
                    }}
                  >
                    <Tab
                      key="netease"
                      title={
                        <div className="flex items-center justify-center space-x-2 w-[100px]">
                          <img src="/assets/netease_icon.png" className="h-4.5" />
                          <span className="font-poppins">网易云音乐</span>
                        </div>
                      }
                    />
                    <Tab
                      key="qq"
                      title={
                        <div className="flex items-center justify-center space-x-2 w-[80px]">
                          <img src="/assets/qq_icon.png" className="h-4.5" />
                          <span className="font-poppins">QQ音乐</span>
                        </div>
                      }
                    />
                  </Tabs>
                </div>

                {/* 智能匹配最佳歌词 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>智能匹配最佳歌词</span>
                    <span className="flex items-center text-color-desc text-sm">
                      同时从两种歌词源获取歌词，返回最佳结果
                      <Tooltip
                        className="px-3"
                        closeDelay={200}
                        color="foreground"
                        content="当结果相近时，将自动使用当前选定的歌词源"
                        delay={200}
                        placement="bottom"
                      >
                        <InfoCircle className="ml-1 z-[2]" size={16} />
                      </Tooltip>
                    </span>
                  </div>
                  <Switch
                    isSelected={settingsCommon.autoSelectBestLyric}
                    onValueChange={(isSelected) => {
                      setSettingsCommon(prev => ({ ...prev, autoSelectBestLyric: isSelected }));
                    }}
                  />
                </div>
              </div>

              <Divider />

              {/* 配置文件 */}
              <div className="flex flex-col gap-4">
                <h2 className="text-base text-default-800 font-bold leading-6 flex items-center gap-1.5">
                  配置文件
                  <Tooltip
                    className="px-3"
                    closeDelay={200}
                    content="查看帮助"
                    delay={200}
                    placement="right"
                  >
                    <QuestionCircleSolid
                      className="cursor-pointer"
                      size={18}
                      onClick={onProfileHelpModalOpen}
                    />
                  </Tooltip>
                </h2>
                <Select
                  className="w-full font-poppins transition-all"
                  classNames={{
                    trigger: "cursor-pointer transition-background !duration-150",
                    innerWrapper: "pl-1",
                  }}
                  selectedKeys={new Set([profileId])}
                  scrollShadowProps={{
                    isEnabled: false,
                    hideScrollBar: false,
                  }}
                  size="lg"
                  maxListboxHeight={320}
                  onSelectionChange={(keys) => {
                    if (keys instanceof Set && keys.size > 0) {
                      const key = String(Array.from(keys)[0]);
                      setProfileId(key);
                    }
                  }}
                >
                  {Object.entries(PROFILE_GROUPS).map(
                    ([groupKey, profileKeys], groupIndex, arr) => {
                      const isLastGroup = groupIndex === arr.length - 1;

                      return (
                        <SelectSection
                          key={groupKey}
                          classNames={{
                            heading: "px-2 leading-6 cursor-default user-select-none",
                          }}
                          showDivider={!isLastGroup}
                          title={groupKey === "lyricPage" ? "歌词页面" : "播放器页面"}
                        >
                          {profileKeys.map((profileKey, index) => {
                            // 检查是否为最后一个元素，用于控制 margin
                            const isLast = index === profileKeys.length - 1;

                            return (
                              <SelectItem
                                key={profileKey}
                                className={`h-11 mb-1 ${isLast ? "last:mb-0" : ""}`}
                                classNames={{
                                  base: "px-4",
                                  title: "text-base font-poppins",
                                }}
                              >
                                {PROFILE_MAP[profileKey]}
                              </SelectItem>
                            );
                          })}
                        </SelectSection>
                      );
                    },
                  )}
                </Select>
              </div>

              {/* 组件集成 */}
              <div className="flex flex-col gap-4">
                <h1 className="text-xl text-default-800 font-bold leading-9">
                  组件集成
                </h1>
                <IntegrationCard
                  path="/lyric"
                  profileId={profileId}
                />
              </div>

              <Divider />

              {/* 字体与外观 */}
              <div className="flex flex-col gap-4 font-poppins">
                <h1 className="text-xl text-default-800 font-bold leading-9">
                  字体与外观
                </h1>

                <h2 className="text-base text-default-800 font-bold leading-6">
                  基础样式
                </h2>
                {/* 主字体 */}
                <div className="group relative flex flex-col w-full max-w-full gap-2 mt-2">
                  <span className="flex items-center text-primary-900 text-xs font-bold cursor-default user-select-none">
                    主字体
                    <Tooltip
                      className="px-3"
                      closeDelay={200}
                      content="歌词显示的主要字体风格"
                      delay={200}
                      placement="right"
                    >
                      <InfoCircle className="ml-1" size={14} />
                    </Tooltip>
                  </span>
                  <div className="flex gap-2">
                    <FontAutocomplete
                      selectedKey={settings.primaryFont}
                      onSelectionChange={(key: string) => {
                        setSettings(prev => ({ ...prev, primaryFont: key }));
                      }}
                    />
                    <Tooltip
                      className="px-3"
                      closeDelay={200}
                      content="刷新字体列表"
                      delay={200}
                      placement="top"
                    >
                      <Button
                        isIconOnly
                        size="lg"
                        variant="flat"
                        className="bg-default-100 hover:bg-[#212123]"
                        onPress={async () => {
                          setIsFontRefresh1Spinning(true);

                          try {
                            const fonts = await refreshLocalFonts();
                            console.log("字体列表刷新成功，共有", fonts.length, "个字体");
                            addToast({
                              title: "刷新成功",
                              description: "字体列表已刷新，共有 " + fonts.length + " 个字体",
                              color: "success",
                              timeout: 3000,
                            });
                          } catch (error : any) {
                            console.error("字体列表刷新失败:", error);
                            addToast({
                              title: "刷新失败",
                              description: error.message,
                              color: "danger",
                              timeout: 6000,
                            });
                          }
                        }}
                        onMouseEnter={() => setIsFontRefresh1Hovered(true)}
                        onMouseLeave={() => setIsFontRefresh1Hovered(false)}
                      >
                        <RefreshCw
                          size={16}
                          isHovered={isFontRefresh1Hovered}
                          isSpinning={isFontRefresh1Spinning}
                          onSpinComplete={() => setIsFontRefresh1Spinning(false)}
                        />
                      </Button>
                    </Tooltip>
                  </div>
                </div>

                {/* 备选字体 */}
                <div className="group relative flex flex-col w-full max-w-full gap-2 mt-2">
                  <span className="flex items-center text-primary-900 text-xs font-bold cursor-default user-select-none">
                    备选字体
                    <Tooltip
                      className="px-3"
                      closeDelay={200}
                      content="主字体缺字时的替代字体"
                      delay={200}
                      placement="right"
                    >
                      <InfoCircle className="ml-1" size={14} />
                    </Tooltip>
                  </span>
                  <div className="flex gap-2">
                    <FontAutocomplete
                      selectedKey={settings.fallbackFont}
                      onSelectionChange={(key: string) => {
                        setSettings(prev => ({ ...prev, fallbackFont: key }));
                      }}
                    />
                    <Tooltip
                      className="px-3"
                      closeDelay={200}
                      content="刷新字体列表"
                      delay={200}
                      placement="top"
                    >
                      <Button
                        isIconOnly
                        size="lg"
                        variant="flat"
                        className="bg-default-100 hover:bg-[#212123]"
                        onPress={async () => {
                          setIsFontRefresh2Spinning(true);

                          try {
                            const fonts = await refreshLocalFonts();
                            console.log("字体列表刷新成功，共有", fonts.length, "个字体");
                            addToast({
                              title: "刷新成功",
                              description: "字体列表已刷新，共有 " + fonts.length + " 个字体",
                              color: "success",
                              timeout: 3000,
                            });
                          } catch (error : any) {
                            console.error("字体列表刷新失败:", error);
                            addToast({
                              title: "刷新失败",
                              description: error.message,
                              color: "danger",
                              timeout: 6000,
                            });
                          }
                        }}
                        onMouseEnter={() => setIsFontRefresh2Hovered(true)}
                        onMouseLeave={() => setIsFontRefresh2Hovered(false)}
                      >
                        <RefreshCw
                          size={16}
                          isHovered={isFontRefresh2Hovered}
                          isSpinning={isFontRefresh2Spinning}
                          onSpinComplete={() => setIsFontRefresh2Spinning(false)}
                        />
                      </Button>
                    </Tooltip>
                  </div>
                </div>

                {/* 字体大小 */}
                <div className="group relative flex flex-col w-full max-w-full gap-2 mt-2">
			            <span className="text-primary-900 text-xs font-bold">
                    字体大小
                  </span>
                  <div className="flex gap-2">
                    <Select
                      className="w-full font-poppins"
                      classNames={{
                        trigger: "cursor-pointer transition-background !duration-150",
                        innerWrapper: "pl-1",
                      }}
                      selectedKeys={new Set([settings.fontSize])}
                      size="lg"
                      maxListboxHeight={400}
                      onSelectionChange={(keys) => {
                        if (keys instanceof Set && keys.size > 0) {
                          const key = String(Array.from(keys)[0]);
                          setSettings(prev => ({ ...prev, fontSize: key }));
                        }
                      }}
                    >
                      {Array.from(FONT_SIZE_OPTIONS).map(([key, label]) => (
                        <SelectItem
                          key={key}
                          className="h-11 mb-1 last:mb-0"
                          classNames={{
                            base: "px-4",
                            title: "text-base font-poppins",
                          }}
                        >
                          {label}
                        </SelectItem>
                      ))}
                    </Select>
                    <ButtonGroup>
                      <Button
                        className="bg-default-100 hover:bg-[#212123]"
                        isIconOnly
                        size="lg"
                        variant="flat"
                        onPress={() => adjustFontSize("down")}
                      >
                        <AArrowDown size={22} strokeWidth={1.5} />
                      </Button>
                      <Button
                        className="bg-default-100 hover:bg-[#212123]"
                        isIconOnly
                        size="lg"
                        variant="flat"
                        onPress={() => adjustFontSize("up")}
                      >
                        <AArrowUp size={22} strokeWidth={1.5} />
                      </Button>
                    </ButtonGroup>
                  </div>
                </div>

                {/* 文字颜色 */}
                <div className="group relative flex flex-col w-full max-w-full gap-2 my-2">
			            <span className="text-primary-900 text-xs font-bold">
                    文字颜色
                  </span>
                  <ColorPalette
                    className="my-1"
                    color={settings.color}
                    onChange={(color) => {
                      setSettings(prev => ({ ...prev, color: color }));
                    }}
                  />
                </div>

                {/* 粗体显示 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>粗体显示</span>
                    <span className="text-color-desc text-sm">
                      歌词文字的粗体样式
                    </span>
                  </div>
                  <Switch
                    isSelected={settings.boldEnabled}
                    onValueChange={(isSelected) => {
                      setSettings(prev => ({ ...prev, boldEnabled: isSelected }));
                    }}
                  />
                </div>

                {/* 对齐方式 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>对齐方式</span>
                    <span className="text-color-desc text-sm">
                      歌词在行内的对齐方式
                    </span>
                  </div>
                  <Tabs
                    classNames={{
                      tabList: "p-1",
                      tab: "h-8.5",
                      tabContent: "text-default-600",
                    }}
                    color="primary"
                    radius="lg"
                    selectedKey={settings.textAlign}
                    onSelectionChange={(key) => {
                      setSettings(prev => ({ ...prev, textAlign: String(key) }));
                    }}
                  >
                    <Tab
                      key="left"
                      title={
                        <Tooltip
                          className="px-3"
                          closeDelay={200}
                          content="左对齐"
                          delay={200}
                          placement="top"
                        >
                          <div className="flex items-center justify-center">
                            <TextAlignLeft />
                          </div>
                        </Tooltip>
                      }
                    />
                    <Tab
                      key="center"
                      title={
                        <Tooltip
                          className="px-3"
                          closeDelay={200}
                          content="居中对齐"
                          delay={200}
                          placement="top"
                        >
                          <div className="flex items-center justify-center">
                            <TextAlignCenter />
                          </div>
                        </Tooltip>
                      }
                    />
                    <Tab
                      key="right"
                      title={
                        <Tooltip
                          className="px-3"
                          closeDelay={200}
                          content="右对齐"
                          delay={200}
                          placement="top"
                        >
                          <div className="flex items-center justify-center">
                            <TextAlignRight />
                          </div>
                        </Tooltip>
                      }
                    />
                    <Tab
                      key="justify"
                      title={
                        <Tooltip
                          className="px-3"
                          closeDelay={200}
                          content="两端对齐"
                          delay={200}
                          placement="top"
                        >
                          <div className="flex items-center justify-center">
                            <TextJustify />
                          </div>
                        </Tooltip>
                      }
                    />
                  </Tabs>
                </div>

                {/* 字间距 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>字间距</span>
                    <span className="text-color-desc text-sm">
                      字符之间的间距大小
                    </span>
                  </div>
                  <NumberInput
                    className="w-28 font-poppins"
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">em</span>
                      </div>
                    }
                    labelPlacement="outside-left"
                    maxValue={1}
                    minValue={-1}
                    step={0.01}
                    value={settings.letterSpacing}
                    onValueChange={(val) => {
                      setSettings(prev => ({ ...prev, letterSpacing: val }));
                    }}
                  />
                </div>

                <Divider />

                <h2 className="text-base text-default-800 font-bold leading-6">
                  描边与阴影
                </h2>

                {/* 文字描边 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>文字描边</span>
                    <span className="text-color-desc text-sm">
                      歌词文字的描边效果
                    </span>
                  </div>
                  <Switch
                    isSelected={settings.strokeEnabled}
                    onValueChange={(isSelected) => {
                      setSettings(prev => ({ ...prev, strokeEnabled: isSelected }));
                    }}
                  />
                </div>

                {/* 描边颜色 */}
                <div
                  className={twMerge(
                    "group relative flex flex-col w-full max-w-full gap-2",
                    "overflow-hidden transition-all duration-400",
                    settings.strokeEnabled ? "opacity-100 max-h-40 my-2" : "opacity-0 max-h-0 -my-2 pointer-events-none"
                  )}
                >
			            <span className="text-primary-900 text-xs font-bold">
                    描边颜色
                  </span>
                  <ColorPalette
                    className="my-1"
                    color={settings.strokeColor}
                    onChange={(color) => {
                      setSettings(prev => ({ ...prev, strokeColor: color }));
                    }}
                  />
                </div>

                {/* 文字阴影 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>文字阴影</span>
                    <span className="text-color-desc text-sm">
                      歌词文字的阴影效果
                    </span>
                  </div>
                  <Switch
                    isSelected={settings.shadowEnabled}
                    onValueChange={(isSelected) => {
                      setSettings(prev => ({ ...prev, shadowEnabled: isSelected }));
                    }}
                  />
                </div>

                {/* 阴影颜色 */}
                <div
                  className={twMerge(
                    "group relative flex flex-col w-full max-w-full gap-2",
                    "overflow-hidden transition-all duration-400",
                    settings.shadowEnabled ? "opacity-100 max-h-40 my-2" : "opacity-0 max-h-0 -my-2 pointer-events-none"
                  )}
                >
			            <span className="text-primary-900 text-xs font-bold">
                    阴影颜色
                  </span>
                  <ColorPalette
                    className="my-1"
                    color={settings.shadowColor}
                    onChange={(color) => {
                      setSettings(prev => ({ ...prev, shadowColor: color }));
                    }}
                  />
                </div>

                {/* 阴影模糊度 */}
                <div
                  className={twMerge(
                    "group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16",
                    "overflow-hidden transition-all duration-400",
                    settings.shadowEnabled ? "opacity-100 max-h-40" : "opacity-0 max-h-0 -my-2 pointer-events-none"
                  )}
                >
                  <div className="flex flex-col gap-[2px]">
                    <span>阴影模糊度</span>
                    <span className="text-color-desc text-sm">
                      阴影边缘的模糊半径
                    </span>
                  </div>
                  <NumberInput
                    className="w-28 font-poppins"
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">px</span>
                      </div>
                    }
                    labelPlacement="outside-left"
                    maxValue={50}
                    minValue={0}
                    step={1}
                    value={settings.shadowBlur}
                    onValueChange={(val) => {
                      setSettings(prev => ({ ...prev, shadowBlur: val }));
                    }}
                  />
                </div>

                {/* 阴影水平偏移 */}
                <div
                  className={twMerge(
                    "group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16",
                    "overflow-hidden transition-all duration-400",
                    settings.shadowEnabled ? "opacity-100 max-h-40" : "opacity-0 max-h-0 -my-2 pointer-events-none"
                  )}
                >
                  <div className="flex flex-col gap-[2px]">
                    <span>阴影水平偏移</span>
                    <span className="text-color-desc text-sm">
                      阴影在水平方向的偏移量
                    </span>
                  </div>
                  <NumberInput
                    className="w-28 font-poppins"
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">px</span>
                      </div>
                    }
                    labelPlacement="outside-left"
                    maxValue={500}
                    minValue={0}
                    step={1}
                    value={settings.shadowXOffset}
                    onValueChange={(val) => {
                      setSettings(prev => ({ ...prev, shadowXOffset: val }));
                    }}
                  />
                </div>

                {/* 阴影垂直偏移 */}
                <div
                  className={twMerge(
                    "group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16",
                    "overflow-hidden transition-all duration-400",
                    settings.shadowEnabled ? "opacity-100 max-h-40" : "opacity-0 max-h-0 -my-2 pointer-events-none"
                  )}
                >
                  <div className="flex flex-col gap-[2px]">
                    <span>阴影垂直偏移</span>
                    <span className="text-color-desc text-sm">
                      阴影在垂直方向的偏移量
                    </span>
                  </div>
                  <NumberInput
                    className="w-28 font-poppins"
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">px</span>
                      </div>
                    }
                    labelPlacement="outside-left"
                    maxValue={500}
                    minValue={0}
                    step={1}
                    value={settings.shadowYOffset}
                    onValueChange={(val) => {
                      setSettings(prev => ({ ...prev, shadowYOffset: val }));
                    }}
                  />
                </div>
              </div>

              <Divider />

              {/* 内容与显示 */}
              <div className="flex flex-col gap-4 font-poppins">
                <h1 className="text-xl text-default-800 font-bold leading-9">
                  内容与显示
                </h1>

                <h2 className="text-base text-default-800 font-bold leading-6">
                  歌词模式
                </h2>

                {/* 显示翻译歌词 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>显示翻译歌词</span>
                    <span className="text-color-desc text-sm">
                      外文歌词显示翻译内容
                    </span>
                  </div>
                  <Switch
                    isSelected={settings.showTranslation}
                    onValueChange={(isSelected) => {
                      setSettings(prev => ({ ...prev, showTranslation: isSelected }));
                    }}
                  />
                </div>

                {/* 翻译行缩放比例 */}
                <div
                  className={twMerge(
                    "flex flex-col gap-2 items-center justify-center w-full max-w-full h-23 transition-all",
                    settings.showTranslation ? "opacity-100" : "opacity-40 [&_*]:!text-foreground pointer-events-none select-none",
                  )}
                >
                  <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0">
                    <div className="flex flex-col gap-[2px]">
                      <span>翻译行缩放比例</span>
                      <span className="text-color-desc text-sm transition-all">
                        翻译歌词相对于主歌词的字体比例
                      </span>
                    </div>
                    <div>
                      {Math.round(settings.subLineFontSize * 100)}%
                    </div>
                  </div>
                  <Slider
                    className="max-w-full w-full"
                    color="foreground"
                    size="sm"
                    aria-label="SubLine Font Size Slider"
                    maxValue={1}
                    minValue={0}
                    step={0.05}
                    value={settings.subLineFontSize}
                    onChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      setSettings(prev => ({ ...prev, subLineFontSize: v }));
                    }}
                  />
                </div>

                {/* 逐字歌词模式 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>逐字歌词模式</span>
                    <span className="text-color-desc text-sm">
                      逐字高亮的显示方式
                    </span>
                  </div>
                  <Switch
                    isSelected={settings.karaokeLyricEnabled}
                    onValueChange={(isSelected) => {
                      setSettings(prev => ({ ...prev, karaokeLyricEnabled: isSelected }));
                    }}
                  />
                </div>

                {/* 隐藏已播歌词 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>隐藏已播歌词</span>
                    <span className="text-color-desc text-sm">
                      已播放歌词自动隐藏
                    </span>
                  </div>
                  <Switch
                    isSelected={settings.hidePassedLines}
                    onValueChange={(isSelected) => {
                      setSettings(prev => ({ ...prev, hidePassedLines: isSelected }));
                    }}
                  />
                </div>

                {/* 间奏提示点位置 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>间奏提示点位置</span>
                    <span className="text-color-desc text-sm">
                      间奏状态下提示点的显示位置
                    </span>
                  </div>
                  <NumberInput
                    className="w-28 font-poppins"
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">em</span>
                      </div>
                    }
                    labelPlacement="outside-left"
                    maxValue={150}
                    minValue={-150}
                    step={0.1}
                    value={settings.interludeDotsPosition}
                    onValueChange={(val) => {
                      setSettings(prev => ({ ...prev, interludeDotsPosition: val }));
                    }}
                  />
                </div>

                <Divider />

                <h2 className="text-base text-default-800 font-bold leading-6">
                  状态与同步
                </h2>

                {/* 时间偏移 */}
                <div className="flex flex-col gap-2 items-center justify-center w-full max-w-full h-35">
                  <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0">
                    <div className="flex flex-col gap-[2px]">
                      <span>时间偏移</span>
                      <span className="text-color-desc text-sm">
                        歌词时间轴的整体偏移量
                      </span>
                    </div>
                    <div>
                      {settings.timeOffset === 0
                        ? "0 ms"
                        : `${settings.timeOffset > 0 ? "+" : "-"}${Math.abs(settings.timeOffset)} ms`}
                    </div>
                  </div>
                  <Slider
                    className="max-w-full w-full"
                    color="foreground"
                    size="sm"
                    aria-label="Time Offset Slider"
                    maxValue={1500}
                    minValue={-1500}
                    step={10}
                    fillOffset={0}
                    value={settings.timeOffset}
                    onChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      setSettings(prev => ({ ...prev, timeOffset: v }));
                    }}
                  />
                  <div className="flex justify-between items-center w-full">
                    <Tooltip
                      className="px-3 font-poppins"
                      closeDelay={200}
                      content="延后 50 ms"
                      delay={200}
                      placement="right"
                    >
                      <Button
                        isIconOnly
                        variant="flat"
                        onPress={() => {
                          const newOffset = Math.max(settings.timeOffset - 50, -1500);
                          setSettings(prev => ({ ...prev, timeOffset: newOffset }));
                        }}
                      >
                        <Delay50Icon size={22} strokeWidth={1.5} />
                      </Button>
                    </Tooltip>
                    <Tooltip
                      className="px-3 font-poppins"
                      closeDelay={200}
                      content="重置为 0 ms"
                      delay={200}
                      placement="right"
                    >
                      <Button
                        isIconOnly
                        variant="flat"
                        onPress={() => {
                          setSettings(prev => ({ ...prev, timeOffset: 0 }));
                        }}
                      >
                        <Reset0Icon size={22} strokeWidth={1.5} />
                      </Button>
                    </Tooltip>
                    <Tooltip
                      className="px-3 font-poppins"
                      closeDelay={200}
                      content="提前 50 ms"
                      delay={200}
                      placement="left"
                    >
                      <Button
                        isIconOnly
                        variant="flat"
                        onPress={() => {
                          const newOffset = Math.min(settings.timeOffset + 50, 1500);
                          setSettings(prev => ({ ...prev, timeOffset: newOffset }));
                        }}
                      >
                        <Advance50Icon size={22} strokeWidth={1.5} />
                      </Button>
                    </Tooltip>
                  </div>
                </div>

                {/* 无歌词显示歌名 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>无歌词显示歌名</span>
                    <span className="text-color-desc text-sm">
                      无歌词时显示歌曲名称
                    </span>
                  </div>
                  <Switch
                    isSelected={settings.showTitleWhenNoLyric}
                    onValueChange={(isSelected) => {
                      setSettings(prev => ({ ...prev, showTitleWhenNoLyric: isSelected }));
                    }}
                  />
                </div>

                {/* 无歌词提示文字 */}
                <div
                  className={twMerge(
                    "group relative flex flex-col w-full max-w-full gap-2 mt-2 transition-all",
                    !settings.showTitleWhenNoLyric ? "opacity-100" : "opacity-40 [&_*]:!text-foreground pointer-events-none select-none",
                  )}
                >
                  <span className="flex items-center text-primary-900 text-xs font-bold cursor-default user-select-none">
                    无歌词提示文字
                    <Tooltip
                      className="px-3"
                      closeDelay={200}
                      content="无歌词时显示的提示内容（可留空）"
                      delay={200}
                      placement="right"
                    >
                      <InfoCircle className="ml-1" size={14} />
                    </Tooltip>
                  </span>
                  <div className="flex gap-2">
                    <Input
                      className="max-w-full w-full"
                      classNames={{
                        inputWrapper: "px-4",
                      }}
                      type="text"
                      size="lg"
                      value={settings.noLyricText}
                      onValueChange={(val) => {
                        setSettings(prev => ({ ...prev, noLyricText: val }));
                      }}
                    />
                    <Tooltip
                      className="px-3"
                      closeDelay={200}
                      content="清除文字"
                      delay={200}
                      placement="top"
                    >
                      <Button
                        isIconOnly
                        size="lg"
                        variant="flat"
                        className="bg-default-100 hover:bg-[#212123]"
                        onPress={() => {
                          setSettings(prev => ({ ...prev, noLyricText: "" }));
                        }}
                      >
                        <Delete size={22} strokeWidth={1.5} />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <Divider />

              {/* 动画与布局 */}
              <div className="flex flex-col gap-4 font-poppins">
                <h1 className="text-xl text-default-800 font-bold leading-9">
                  动画与布局
                </h1>

                <h2 className="text-base text-default-800 font-bold leading-6">
                  动态效果
                </h2>

                {/* 弹性动画 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>弹性动画</span>
                    <span className="flex items-center text-color-desc text-sm">
                      歌词切换时的回弹动画效果
                      <Tooltip
                        className="px-3"
                        closeDelay={200}
                        color="foreground"
                        content="对性能影响较大，如果遇到性能问题，可尝试关闭此项（默认开启）"
                        delay={200}
                        placement="bottom"
                      >
                        <InfoCircle className="ml-1 z-[2]" size={16} />
                      </Tooltip>
                    </span>
                  </div>
                  <Switch
                    isSelected={settings.springAnimationEnabled}
                    onValueChange={(isSelected) => {
                      setSettings(prev => ({ ...prev, springAnimationEnabled: isSelected }));
                    }}
                  />
                </div>

                {/* 模糊效果 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>模糊效果</span>
                    <span className="flex items-center text-color-desc text-sm">
                      非当前歌词行的模糊处理
                      <Tooltip
                        className="px-3"
                        closeDelay={200}
                        color="foreground"
                        content="对性能影响较大，如果遇到性能问题，可尝试关闭此项（默认开启）"
                        delay={200}
                        placement="bottom"
                      >
                        <InfoCircle className="ml-1 z-[2]" size={16} />
                      </Tooltip>
                    </span>
                  </div>
                  <Switch
                    isSelected={settings.blurEffectEnabled}
                    onValueChange={(isSelected) => {
                      setSettings(prev => ({ ...prev, blurEffectEnabled: isSelected }));
                    }}
                  />
                </div>

                {/* 缩放效果 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>缩放效果</span>
                    <span className="flex items-center text-color-desc text-sm">
                      当前歌词行的放大强调效果
                      <Tooltip
                        className="px-3"
                        closeDelay={200}
                        color="foreground"
                        content="不影响性能，非当前播放歌词行会略微缩小（默认开启）"
                        delay={200}
                        placement="bottom"
                      >
                        <InfoCircle className="ml-1 z-[2]" size={16} />
                      </Tooltip>
                    </span>
                  </div>
                  <Switch
                    isSelected={settings.scaleEffectEnabled}
                    onValueChange={(isSelected) => {
                      setSettings(prev => ({ ...prev, scaleEffectEnabled: isSelected }));
                    }}
                  />
                </div>

                <Divider />

                <h2 className="text-base text-default-800 font-bold leading-6">
                  空间位置
                </h2>

                {/* 基准对齐位置 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>基准对齐位置</span>
                    <span className="text-color-desc text-sm">
                      当前歌词行在垂直方向的参考位置
                    </span>
                  </div>
                  <NumberInput
                    className="w-28 font-poppins"
                    labelPlacement="outside-left"
                    maxValue={1}
                    minValue={0}
                    step={0.01}
                    value={settings.alignPosition}
                    onValueChange={(val) => {
                      setSettings(prev => ({ ...prev, alignPosition: val }));
                    }}
                  />
                </div>

                {/* 水平位移 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>水平位移</span>
                    <span className="text-color-desc text-sm">
                      歌词整体的水平偏移量
                    </span>
                  </div>
                  <NumberInput
                    className="w-28 font-poppins"
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">px</span>
                      </div>
                    }
                    labelPlacement="outside-left"
                    maxValue={2000}
                    minValue={-2000}
                    step={1}
                    value={settings.translateX}
                    onValueChange={(val) => {
                      setSettings(prev => ({ ...prev, translateX: val }));
                    }}
                  />
                </div>

                {/* 垂直位移 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>垂直位移</span>
                    <span className="text-color-desc text-sm">
                      歌词整体的垂直偏移量
                    </span>
                  </div>
                  <NumberInput
                    className="w-28 font-poppins"
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">px</span>
                      </div>
                    }
                    labelPlacement="outside-left"
                    maxValue={2000}
                    minValue={-2000}
                    step={1}
                    value={settings.translateY}
                    onValueChange={(val) => {
                      setSettings(prev => ({ ...prev, translateY: val }));
                    }}
                  />
                </div>

                {/* 3D 透视强度 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>3D 透视强度</span>
                    <span className="flex items-center text-color-desc text-sm">
                      歌词与视点之间的距离
                      <Tooltip
                        className="px-3 font-poppins"
                        closeDelay={200}
                        color="foreground"
                        content="数值越小立体感越强，数值越大画面越平缓（默认为 800）"
                        delay={200}
                        placement="bottom"
                      >
                        <InfoCircle className="ml-1 z-[2]" size={16} />
                      </Tooltip>
                    </span>
                  </div>
                  <NumberInput
                    className="w-28 font-poppins"
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">px</span>
                      </div>
                    }
                    labelPlacement="outside-left"
                    maxValue={2000}
                    minValue={200}
                    step={5}
                    value={settings.perspective}
                    onValueChange={(val) => {
                      setSettings(prev => ({ ...prev, perspective: val }));
                    }}
                  />
                </div>

                {/* 上下倾斜角度 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>上下倾斜角度</span>
                    <span className="flex items-center text-color-desc text-sm">
                      歌词在垂直方向的倾斜角度
                      <Tooltip
                        className="px-3 font-poppins"
                        closeDelay={200}
                        color="foreground"
                        content="正值向后仰，负值向前俯"
                        delay={200}
                        placement="bottom"
                      >
                        <InfoCircle className="ml-1 z-[2]" size={16} />
                      </Tooltip>
                    </span>
                  </div>
                  <NumberInput
                    className="w-28 font-poppins"
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">deg</span>
                      </div>
                    }
                    labelPlacement="outside-left"
                    maxValue={60}
                    minValue={-60}
                    step={1}
                    value={settings.rotateX}
                    onValueChange={(val) => {
                      setSettings(prev => ({ ...prev, rotateX: val }));
                    }}
                  />
                </div>

                {/* 左右倾斜角度 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>左右倾斜角度</span>
                    <span className="flex items-center text-color-desc text-sm">
                      歌词在水平方向的倾斜角度
                      <Tooltip
                        className="px-3 font-poppins"
                        closeDelay={200}
                        color="foreground"
                        content="正值向右倾斜，负值向左倾斜"
                        delay={200}
                        placement="bottom"
                      >
                        <InfoCircle className="ml-1 z-[2]" size={16} />
                      </Tooltip>
                    </span>
                  </div>
                  <NumberInput
                    className="w-28 font-poppins"
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">deg</span>
                      </div>
                    }
                    labelPlacement="outside-left"
                    maxValue={60}
                    minValue={-60}
                    step={1}
                    value={settings.rotateY}
                    onValueChange={(val) => {
                      setSettings(prev => ({ ...prev, rotateY: val }));
                    }}
                  />
                </div>
              </div>

              <Divider />

              {/* 背景与渲染 */}
              <div className="flex flex-col gap-4 font-poppins">
                <h1 className="text-xl text-default-800 font-bold leading-9">
                  背景与渲染
                </h1>

                <h2 className="text-base text-default-800 font-bold leading-6">
                  背景设置
                </h2>

                {/* 显示背景 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>显示背景</span>
                    <span className="text-color-desc text-sm">
                      歌词背景图层的启用状态
                    </span>
                  </div>
                  <Switch
                    isSelected={settings.backgroundEnabled}
                    onValueChange={(isSelected) => {
                      setSettings(prev => ({ ...prev, backgroundEnabled: isSelected }));
                    }}
                  />
                </div>

                {/* 背景渲染器 */}
                <div
                  className={twMerge(
                    "group relative flex flex-col w-full max-w-full gap-2 my-2 transition-all",
                    settings.backgroundEnabled ? "opacity-100" : "opacity-40 [&_*]:!text-foreground pointer-events-none select-none",
                  )}
                >
                  <span className="flex items-center text-primary-900 text-xs font-bold cursor-default user-select-none">
                    背景渲染器
                    <Tooltip
                      className="px-3"
                      closeDelay={200}
                      content="背景内容的渲染方式（默认为网格渐变渲染器）"
                      delay={200}
                      placement="right"
                    >
                      <InfoCircle className="ml-1" size={14} />
                    </Tooltip>
                  </span>
                  <div className="flex gap-2">
                    <Select
                      className="w-full font-poppins"
                      classNames={{
                        trigger: "cursor-pointer transition-background !duration-150",
                        innerWrapper: "pl-1",
                      }}
                      selectedKeys={new Set([settings.backgroundRenderer])}
                      size="lg"
                      onSelectionChange={(keys) => {
                        if (keys instanceof Set && keys.size > 0) {
                          const key = String(Array.from(keys)[0]);
                          setSettings(prev => ({ ...prev, backgroundRenderer: key }));
                        }
                      }}
                    >
                      <SelectItem
                        key="MeshGradientRenderer"
                        className="h-11 mb-1 last:mb-0"
                        classNames={{
                          base: "px-4",
                          title: "text-base font-poppins",
                        }}
                      >
                        网格渐变渲染器
                      </SelectItem>
                      <SelectItem
                        key="PixiRenderer"
                        className="h-11 mb-1 last:mb-0"
                        classNames={{
                          base: "px-4",
                          title: "text-base font-poppins",
                        }}
                      >
                        Pixi 渲染器
                      </SelectItem>
                    </Select>
                  </div>
                </div>

                <Divider />

                <h2 className="text-base text-default-800 font-bold leading-6">
                  全局滤镜
                </h2>

                {/* 不透明度 */}
                <div className="flex flex-col gap-2 items-center justify-center w-full max-w-full my-2">
                  <Slider
                    className="max-w-full w-full"
                    classNames={{
                      label: "text-base",
                      value: "text-base font-poppins",
                      labelWrapper: "mb-1",
                    }}
                    color="foreground"
                    size="sm"
                    label="不透明度"
                    aria-label="Opacity Slider"
                    maxValue={1}
                    minValue={0}
                    step={0.01}
                    formatOptions={{ style: "percent" }}
                    value={settings.opacity}
                    onChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      setSettings(prev => ({ ...prev, opacity: v }));
                    }}
                  />
                </div>

                {/* 亮度 */}
                <div className="flex flex-col gap-2 items-center justify-center w-full max-w-full my-2">
                  <Slider
                    className="max-w-full w-full"
                    classNames={{
                      label: "text-base",
                      value: "text-base font-poppins",
                      labelWrapper: "mb-1",
                    }}
                    color="foreground"
                    size="sm"
                    label="亮度"
                    aria-label="Brightness Slider"
                    maxValue={2}
                    minValue={0}
                    step={0.01}
                    fillOffset={1}
                    getValue={(val) => {
                      let v = Array.isArray(val) ? val[0] : val;
                      v = v - 1;
                      return `${v >= 0 ? "+" : "-"}${Math.round(Math.abs(v) * 100)}`;
                    }}
                    value={settings.brightness}
                    onChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      setSettings(prev => ({ ...prev, brightness: v }));
                    }}
                  />
                </div>

                {/* 对比度 */}
                <div className="flex flex-col gap-2 items-center justify-center w-full max-w-full my-2">
                  <Slider
                    className="max-w-full w-full"
                    classNames={{
                      label: "text-base",
                      value: "text-base font-poppins",
                      labelWrapper: "mb-1",
                    }}
                    color="foreground"
                    size="sm"
                    label="对比度"
                    aria-label="Contrast Slider"
                    maxValue={2}
                    minValue={0}
                    step={0.01}
                    fillOffset={1}
                    getValue={(val) => {
                      let v = Array.isArray(val) ? val[0] : val;
                      v = v - 1;
                      return `${v >= 0 ? "+" : "-"}${Math.round(Math.abs(v) * 100)}`;
                    }}
                    value={settings.contrast}
                    onChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      setSettings(prev => ({ ...prev, contrast: v }));
                    }}
                  />
                </div>

                {/* 饱和度 */}
                <div className="flex flex-col gap-2 items-center justify-center w-full max-w-full my-2">
                  <Slider
                    className="max-w-full w-full"
                    classNames={{
                      label: "text-base",
                      value: "text-base font-poppins",
                      labelWrapper: "mb-1",
                    }}
                    color="foreground"
                    size="sm"
                    label="饱和度"
                    aria-label="Saturate Slider"
                    maxValue={2}
                    minValue={0}
                    step={0.01}
                    fillOffset={1}
                    getValue={(val) => {
                      let v = Array.isArray(val) ? val[0] : val;
                      v = v - 1;
                      return `${v >= 0 ? "+" : "-"}${Math.round(Math.abs(v) * 100)}`;
                    }}
                    value={settings.saturate}
                    onChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      setSettings(prev => ({ ...prev, saturate: v }));
                    }}
                  />
                </div>
              </div>

              <Divider />

              {/* 操作 */}
              <div className="flex flex-col gap-4 font-poppins">
                <h1 className="text-xl text-default-800 font-bold leading-9">
                  操作
                </h1>

                {/* 恢复默认 */}
                <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-20 p-0 h-16">
                  <div className="flex flex-col gap-[2px]">
                    <span>恢复默认</span>
                    <span className="text-color-desc text-sm">
                      将当前配置文件还原为默认状态
                    </span>
                  </div>
                  <Button
                    color="danger"
                    variant="ghost"
                    onPress={onResetProfileModalOpen}
                  >
                    恢复默认
                  </Button>
                </div>
              </div>

              <Spacer y={2} />
            </div>
          </OverlayScrollbarsComponent>
        </div>

        {/* 右侧 - 歌词预览 */}
        <div className="w-full md:w-1/2 md:h-full min-h-[600px] flex flex-col">
          <div className="flex justify-between items-center mb-2.5">
            <Tabs
              classNames={{
                tabList: "p-0 gap-0",
                tab: "h-5.5 data-[selected=true]:bg-default-100 transition-all",
              }}
              color="default"
              size="sm"
              radius="full"
              variant="light"
              disableAnimation={true}
              selectedKey={previewBackground}
              onSelectionChange={(key) => {
                setPreviewBackground(String(key));
              }}
            >
              <Tab
                key="grid"
                title="网格背景"
              />
              <Tab
                key="solid"
                title="纯色背景"
              />
            </Tabs>
            <Link
              className="cursor-pointer text-xs text-default-500"
              showAnchorIcon
              color="foreground"
              onPress={() => {openExternalUrl("https://www.kdocs.cn/l/cnIbwjBpIui3");}}
            >
              常见问题解答
            </Link>
          </div>
          <div
            className="flex-1 flex flex-col rounded-lg overflow-hidden"
            style={
              previewBackground === "solid"
                ? {
                  backgroundColor: "#1a1a1c"
                }
                : {
                  backgroundColor: "#181818",
                  backgroundImage:
                    "linear-gradient(45deg, #27272a 25%, transparent 25%, transparent 75%, #27272a 75%, #27272a), " +
                    "linear-gradient(45deg, #27272a 25%, transparent 25%, transparent 75%, #27272a 75%, #27272a)",
                  backgroundPosition: "0 0, 10px 10px",
                  backgroundSize: "20px 20px"
                }
            }
          >
            <div className="flex-1 relative overflow-hidden">
              <div
                id="player-container"
                className="absolute isolate w-full h-full overflow-hidden"
                style={{
                  opacity: settings.opacity,
                  filter: `brightness(${settings.brightness}) contrast(${settings.contrast}) saturate(${settings.saturate})`,
                }}
              >
                {settings.backgroundEnabled && (
                  <BackgroundRender
                    className="absolute inset-0 z-0"
                    album={coverBase64}
                    renderer={settings.backgroundRenderer === "PixiRenderer" ? PixiRenderer : MeshGradientRenderer}
                  />
                )}
                <div className="absolute top-0 left-0 w-full h-full">
                  <div
                    id="lyric-player-wrapper"
                    className="w-full h-full"
                    style={{
                      mixBlendMode: "plus-lighter",
                      paddingRight: "4%",
                      contain: "paint",
                      maskImage: "linear-gradient(transparent, black 10%, black 90%, transparent)",
                      WebkitMaskImage: "linear-gradient(transparent, black 10%, black 90%, transparent)",
                    }}
                  >
                    <LyricView
                      className="w-full h-full"
                      profileId={profileId}
                      alignPosition={settings.alignPosition}
                      alignAnchor="center"
                      settings={settings}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 配置文件帮助模态框 */}
      <Modal
        isOpen={isProfileHelpModalOpen}
        onOpenChange={onProfileHelpModalOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                什么是配置文件？
              </ModalHeader>
              <ModalBody className="flex flex-col gap-4">
                <p className="leading-7">
                  配置文件能够保存您对直播组件的设置！您可以把每个配置文件认为是一套不同的外观。
                </p>
                <p className="leading-7">
                  每一个配置文件都对应于独立的链接，在直播软件里您可以把它们进行混搭使用，或者每个场景各使用一种。
                </p>
                <p className="leading-7">
                  发挥您的创意！您可以设计 5 个配置文件 🤩
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  确定
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* 恢复默认模态框 */}
      <Modal isOpen={isResetProfileModalOpen} onOpenChange={onResetProfileModalOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">提示</ModalHeader>
              <ModalBody>
                <p className="leading-7">
                  您确定要将{" "}
                  <Code className="font-poppins" color="primary">
                    {PROFILE_MAP[profileId] ?? "当前配置"}
                  </Code>{" "}
                  恢复默认吗？
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="flat" onPress={onClose}>
                  取消
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    onClose();

                    const defaultSettings = {
                      ...DEFAULT_SETTINGS_LYRIC,
                      // 如果属于 lyricPage 分组，则将 backgroundEnabled 设为 false
                      ...(PROFILE_GROUPS.lyricPage.includes(profileId) && { backgroundEnabled: false }),
                    };

                    setSettings(defaultSettings);
                  }}
                >
                  确定
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
