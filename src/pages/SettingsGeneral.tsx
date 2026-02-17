import type { Key } from "@react-types/shared";

import React, { useEffect, useState } from "react";
import { Select, SelectItem, SelectSection } from "@heroui/select";
import {
  QuestionCircleSolid,
  TerminalSolid,
  ChevronDown,
  DangerTriangle,
  InfoCircle,
} from "@mynaui/icons-react";
import { useDisclosure } from "@heroui/use-disclosure";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Spacer } from "@heroui/spacer";
import { Code } from "@heroui/code";
import { addToast } from "@heroui/toast";
import { Tabs, Tab } from "@heroui/tabs";
import { PlayCircleFilled } from "@ant-design/icons";
import { Chip } from "@heroui/chip";
import { Tooltip } from "@heroui/tooltip";
import { Divider } from "@heroui/divider";
import { Switch } from "@heroui/switch";
import { motion, AnimatePresence } from "framer-motion";

import PlatformHelpDrawer from "@/components/PlatformHelpDrawer";
import { SpotifyIcon, YouTubeMusicIcon } from "@/components/Icons";
import { PLATFORM_MAP } from "@/constants/platformMap";
import { Sparkles } from "@/components/animate-icons/Sparkles";

// 音乐平台分组
const platformGroups = {
  domestic: ["netease", "qq", "kugou", "kuwo", "soda"],
  foreign: ["spotify", "apple", "youtube"],
  jukebox: ["miebo", "ayna", "huahua", "bq"],
  local: ["potplayer", "foobar", "aimp"],
  other: ["lx", "musicfree", "cider", "yesplay"],
};

// 音乐平台分组名称
const platformGroupTitles: Record<string, string> = {
  domestic: "国内平台",
  foreign: "国外平台",
  jukebox: "点歌机",
  local: "本地播放器",
  other: "其它",
};

// 获取需要展示的音乐平台
const getTargetVisibleRows = (plat: string): string[] => {
  if (platformGroups.local.includes(plat)) {
    return ["domestic", "foreign", "local"];
  } else if (platformGroups.other.includes(plat)) {
    return ["domestic", "foreign", "other"];
  }

  return ["domestic", "foreign", "jukebox"];
};

const rowVariants = {
  initial: {
    height: 0,
    opacity: 0,
    scaleY: 0.95,
    y: -8
  },
  animate: {
    height: "auto",
    opacity: 1,
    scaleY: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 28,
      mass: 1.1,
      opacity: {
        type: "spring",
        stiffness: 180,
        damping: 30,
      },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    scaleY: 0.95,
    y: -8,
    transition: {
      type: "spring",
      stiffness: 180,
      damping: 32,
      mass: 1.2,
      opacity: {
        type: "spring",
        stiffness: 180,
        damping: 30,
      },
    },
  },
} as const;

const AnimatedRow: React.FC<{ show: boolean; children: React.ReactNode }> = ({show, children}) => (
  <AnimatePresence initial={false}>
    {show && (
      <motion.div
        className="overflow-hidden origin-top"
        variants={rowVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

const TabTitle: React.FC<{ icon: React.ReactNode; label: string }> = ({icon, label,}) => {
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 643px)");

    const update = () => setIsSmall(mq.matches);
    update();

    mq.addEventListener("change", update);

    return () => {
      mq.removeEventListener("change", update);
    };
  }, []);

  const content = (
    <div className="flex items-center space-x-0 min-[644px]:space-x-2">
      {icon}
      <span className="hidden min-[644px]:inline font-poppins">{label}</span>
    </div>
  );

  if (isSmall) {
    return <Tooltip content={label} closeDelay={200}>{content}</Tooltip>;
  }

  return content;
};

// 等待指定毫秒数
const delay = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

export default function GeneralSettingsPage() {
  const [deviceId, setDeviceId] = useState<Set<Key>>();
  const [platform, setPlatform] = useState<string>();
  const [autoLaunchHomePage, setAutoLaunchHomePage] = useState<boolean>();
  const [runAtStartup, setRunAtStartup] = useState<boolean>();
  const [updateCheckFreq, setUpdateCheckFreq] = useState<Set<Key>>();
  const [smtc, setSmtc] = useState<boolean>();
  const [fallbackPlatformEnabled, setFallbackPlatformEnabled] = useState<boolean>();
  const [fallbackPlatform, setFallbackPlatform] = useState<Set<Key>>();
  const [pollInterval, setPollInterval] = useState<Set<Key>>();

  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleRows, setVisibleRows] = useState<string[]>(getTargetVisibleRows(platform ?? "netease"),);
  const [initialized, setInitialized] = useState(false);
  const [isDetectHovered, setIsDetectHovered] = useState(false);

  const {
    isOpen: isDeviceHelpModalOpen,
    onOpen: onDeviceHelpModalOpen,
    onOpenChange: onDeviceHelpModalOpenChange,
  } = useDisclosure();

  const {
    isOpen: isDeviceDetectModalOpen,
    onOpen: onDeviceDetectModalOpen,
    onOpenChange: onDeviceDetectModalOpenChange,
  } = useDisclosure();

  const {
    isOpen: isDeviceDetectNoneModalOpen,
    onOpen: onDeviceDetectNoneModalOpen,
    onOpenChange: onDeviceDetectNoneModalOpenChange,
  } = useDisclosure();

  const {
    isOpen: isDesktopWidgetTipModalOpen,
    onOpen: onDesktopWidgetTipModalOpen,
    onOpenChange: onDesktopWidgetTipModalOpenChange,
  } = useDisclosure();

  const {
    isOpen: isPlatformHelpOpen,
    onOpen: onPlatformHelpOpen,
    onOpenChange: onPlatformHelpOpenChange,
  } = useDisclosure();

  const [devices, setDevices] = useState([
    { key: "default", label: "主声音驱动程序" },
  ]);

  // 保存设置
  const saveSettings = async (newSettings?: Partial<any>) => {
    const currentDeviceId = deviceId ? [...deviceId][0] : "default";
    const currentFallbackPlatform = fallbackPlatform ? [...fallbackPlatform][0] : "netease";
    const currentPollInterval = pollInterval ? Number([...pollInterval][0]) : 100;
    const currentUpdateCheckFreq = updateCheckFreq ? Number([...updateCheckFreq][0]) : 0;

    const body = {
      deviceId: currentDeviceId,
      deviceName:
        devices.find((d) => d.key === currentDeviceId)?.label ??
        "主声音驱动程序",
      platform,
      autoLaunchHomePage,
      runAtStartup,
      updateCheckFreq: currentUpdateCheckFreq,
      smtc,
      fallbackPlatformEnabled,
      fallbackPlatform: currentFallbackPlatform,
      pollInterval: currentPollInterval,
      ...newSettings,
    };

    try {
      const res = await fetch("/api/settings/general", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`HTTP 响应错误！状态码：${res.status}`);
      }

      console.log("保存设置成功");
      addToast({
        title: "保存成功",
        description: "已成功修改设置",
        timeout: 2000,
      });
    } catch (err: any) {
      console.error("保存设置失败", err);
      addToast({
        title: "保存失败",
        description: err.message,
        color: "danger",
        timeout: 6000,
      });
    }
  };

  // 检查是否成功连接平台
  const checkIsConnected = async () => {
    try {
      const response = await fetch("/api/query/isConnected");

      if (!response.ok) {
        throw new Error(`HTTP 响应错误！状态码：${response.status}`);
      }

      const data = await response.json();

      setIsConnected(data.data);
    } catch (error) {
      console.error("检查平台连接状态时出错：", error);
    }
  };

  // 初始加载
  useEffect(() => {
    (async () => {
      // 加载音频设备列表
      try {
        const response = await fetch("/api/audio/devices");

        if (!response.ok) {
          throw new Error(`HTTP 响应错误！状态码：${response.status}`);
        }
        const data = await response.json();

        const formattedDevices = data.map(
          (item: { id: string; name: string }) => ({
            key: item.id,
            label: item.name,
          }),
        );

        setDevices(formattedDevices);
      } catch (error: any) {
        console.error("音频设备列表加载失败：", error);
        addToast({
          title: "音频设备列表加载失败",
          description: error.message,
          color: "danger",
          timeout: 6000,
        });
      }

      // 回显设置
      try {
        const res = await fetch("/api/settings/general");
        const data = await res.json();

        setDeviceId(new Set([data.deviceId]));
        setPlatform(data.platform);
        setAutoLaunchHomePage(data.autoLaunchHomePage);
        setRunAtStartup(data.runAtStartup);
        setUpdateCheckFreq(new Set([String(data.updateCheckFreq)]));
        setSmtc(data.smtc);
        setVisibleRows(getTargetVisibleRows(data.platform));
        setFallbackPlatformEnabled(data.fallbackPlatformEnabled);
        setFallbackPlatform(new Set([data.fallbackPlatform]));
        setPollInterval(new Set([String(data.pollInterval)]));
      } catch (err: any) {
        console.error("通用设置加载失败", err);
        addToast({
          title: "通用设置加载失败",
          description: err.message,
          color: "danger",
          timeout: 6000,
        });
      }

      setTimeout(() => {
        setInitialized(true);
      }, 1000);
    })();
  }, []);

  // 检测平台连接状态（每隔 1 秒一次）
  useEffect(() => {
    // 立即执行一次
    checkIsConnected();

    // 设置定时器
    const intervalId = setInterval(checkIsConnected, 1000);

    // 组件卸载时清除定时器，防止内存泄漏
    return () => clearInterval(intervalId);
  }, []);

  // 监听 platform 变化，自动保存
  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (platform) {
      saveSettings();
    }
  }, [platform]);

  // 修改音乐平台
  const changePlatform = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const key = e.currentTarget.dataset.key;

    if (!key) {
      console.error("修改音乐平台失败：未找到 Tab 的 data-key 属性");
      addToast({
        title: "修改音乐平台失败",
        description: "未找到 Tab 的 data-key 属性",
        color: "danger",
        timeout: 6000,
      });

      return;
    }

    if (key === platform) {
      return;
    }

    if (!Object.keys(PLATFORM_MAP).includes(key)) {
      console.error(`修改音乐平台失败：Tab 的 data-key 属性为 ${key}`);
      addToast({
        title: "修改音乐平台失败",
        description: `Tab 的 data-key 属性为 ${key}`,
        color: "danger",
        timeout: 6000,
      });

      return;
    }

    setPlatform(key);
  };

  // 展开/收起更多音乐平台
  const handleExpand = () => {
    if (!isExpanded) {
      // 展开
      setVisibleRows(["domestic", "foreign", "jukebox", "local", "other"]);
      setIsExpanded(true);
    } else {
      // 收起
      setVisibleRows(getTargetVisibleRows(platform ?? "netease"));
      setIsExpanded(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-full max-w-[800px] py-6 px-10 gap-6">
        <h1 className="text-3xl text-white font-bold leading-9">通用</h1>

        {/* 音频设备 */}
        <div className="flex flex-col gap-4">
          <h2 className="text-base text-default-800 font-bold leading-6 flex items-center gap-1.5">
            音频设备
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
                onClick={onDeviceHelpModalOpen}
              />
            </Tooltip>
          </h2>
          <div className="flex gap-2">
            <Select
              className="w-full font-poppins"
              classNames={{
                trigger: "cursor-pointer transition-background !duration-150",
                innerWrapper: "pl-1",
              }}
              items={devices}
              selectedKeys={deviceId}
              scrollShadowProps={{
                isEnabled: false,
                hideScrollBar: false,
              }}
              size="lg"
              onSelectionChange={(keys) => {
                if (keys instanceof Set && keys.size > 0) {
                  setDeviceId(keys);

                  const newDeviceId = Array.from(keys)[0] as string;

                  saveSettings({
                    deviceId: newDeviceId,
                    deviceName:
                      devices.find((d) => d.key === newDeviceId)?.label ??
                      "主声音驱动程序",
                  });
                }
              }}
            >
              {(device) => (
                <SelectItem
                  key={device.key}
                  className="h-11 mb-1 last:mb-0"
                  classNames={{
                    base: "px-4",
                    title: "text-base font-poppins",
                  }}
                >
                  {device.label}
                </SelectItem>
              )}
            </Select>
            <Button
              className="px-7"
              color="primary"
              size="lg"
              onMouseEnter={() => setIsDetectHovered(true)}
              onMouseLeave={() => setIsDetectHovered(false)}
              onPress={onDeviceDetectModalOpen}
            >
              <div className="flex items-center gap-2">
                <Sparkles
                  className="p-0"
                  isHovered={isDetectHovered}
                  size={18}
                  trigger="none"
                />
                智能识别
              </div>
            </Button>
          </div>
        </div>

        <Spacer y={0} />

        {/* 音乐服务 */}
        <div className="flex flex-col">
          <div className="flex flex-row justify-between items-end">
            <h1 className="text-xl text-default-800 font-bold leading-9">
              音乐服务
            </h1>
            <Tooltip
              closeDelay={200}
              content={
                <div className="px-1 py-2">
                  <div className="text-sm font-bold">无法识别？</div>
                  <Spacer y={0.5} />
                  <div className="text-xs">点击查看解决方案</div>
                </div>
              }
              delay={isConnected ? 800 : 50}
              placement="right"
            >
              <Chip
                className="cursor-pointer select-none"
                color={isConnected ? "success" : "warning"}
                variant="dot"
                onClick={onPlatformHelpOpen}
              >
                {isConnected ? "已检测到平台" : "未检测到平台"}
              </Chip>
            </Tooltip>
          </div>
          <AnimatedRow show={visibleRows.includes("domestic")}>
            <div className="flex flex-col gap-3 mt-4">
              <span className="text-primary-900 text-xs font-bold">
                国内平台
              </span>
              <Tabs
                classNames={{
                  tabList: "p-1.5",
                  tab: "h-10",
                  tabContent: "text-default-600",
                }}
                color="primary"
                fullWidth={true}
                radius="lg"
                selectedKey={
                  ["netease", "qq", "kugou", "kuwo", "soda"].includes(
                    platform as string,
                  )
                    ? platform
                    : "none"
                }
                size="lg"
              >
                <Tab
                  key="netease"
                  title={<TabTitle icon={<img className="h-4.5" src="/assets/netease_icon.png" />} label="网易云音乐" />}
                  onClick={changePlatform}
                />
                <Tab
                  key="qq"
                  title={<TabTitle icon={<img className="h-4.5" src="/assets/qq_icon.png" />} label="QQ音乐" />}
                  onClick={changePlatform}
                />
                <Tab
                  key="kugou"
                  title={<TabTitle icon={<img className="h-4.5" src="/assets/kugou_icon.png" />} label="酷狗音乐" />}
                  onClick={changePlatform}
                />
                <Tab
                  key="kuwo"
                  title={<TabTitle icon={<img className="h-4.5" src="/assets/kuwo_icon.png" />} label="酷我音乐" />}
                  onClick={changePlatform}
                />
                <Tab
                  key="soda"
                  title={<TabTitle icon={<img className="h-4.5" src="/assets/soda_icon.png" />} label="汽水音乐" />}
                  onClick={changePlatform}
                />
              </Tabs>
            </div>
          </AnimatedRow>
          <AnimatedRow show={visibleRows.includes("foreign")}>
            <div className="flex flex-col gap-3 mt-4">
              <span className="text-primary-900 text-xs font-bold">
                国外平台
              </span>
              <Tabs
                classNames={{
                  tabList: "p-1.5 w-3/4",
                  tab: "h-10",
                  tabContent: "text-default-600",
                }}
                color="primary"
                radius="lg"
                selectedKey={
                  ["spotify", "apple", "youtube"].includes(platform as string)
                    ? platform
                    : "none"
                }
                size="lg"
              >
                <Tab
                  key="spotify"
                  title={<TabTitle icon={<SpotifyIcon size={18} />} label="Spotify" />}
                  onClick={changePlatform}
                />
                <Tab
                  key="apple"
                  title={<TabTitle icon={<img className="h-4.5" src="/assets/apple_icon.png" />} label="Apple Music" />}
                  onClick={changePlatform}
                />
                <Tab
                  key="youtube"
                  title={<TabTitle icon={<YouTubeMusicIcon size={18} />} label="YouTube Music" />}
                  onClick={changePlatform}
                />
              </Tabs>
            </div>
          </AnimatedRow>
          <AnimatedRow show={visibleRows.includes("jukebox")}>
            <div className="flex flex-col gap-3 mt-4">
              <span className="text-primary-900 text-xs font-bold">点歌机</span>
              <Tabs
                classNames={{
                  tabList: "p-1.5",
                  tab: "h-10",
                  tabContent: "text-default-600",
                }}
                color="primary"
                fullWidth={true}
                radius="lg"
                selectedKey={
                  ["miebo", "ayna", "huahua", "bq"].includes(platform as string)
                    ? platform
                    : "none"
                }
                size="lg"
              >
                <Tab
                  key="miebo"
                  title={<TabTitle icon={<img className="h-4.5" src="/assets/miebo_icon.png" />} label="咩播" />}
                  onClick={changePlatform}
                />
                <Tab
                  key="ayna"
                  title={<TabTitle icon={<TerminalSolid size={20} />} label="卡西米尔唱片机" />}
                  onClick={changePlatform}
                />
                <Tab
                  key="huahua"
                  title={<TabTitle icon={<img className="h-4.5" src="/assets/huahua_icon.png" />} label="花花直播助手" />}
                  onClick={changePlatform}
                />
                <Tab
                  key="bq"
                  title={<TabTitle icon={<img className="h-4.5" src="/assets/bq_icon.png" />} label="BQ点歌姬" />}
                  onClick={changePlatform}
                />
              </Tabs>
            </div>
          </AnimatedRow>
          <AnimatedRow show={visibleRows.includes("local")}>
            <div className="flex flex-col gap-3 mt-4">
              <span className="text-primary-900 text-xs font-bold">
                本地播放器
              </span>
              <Tabs
                classNames={{
                  tabList: "p-1.5 w-3/4",
                  tab: "h-10",
                  tabContent: "text-default-600",
                }}
                color="primary"
                radius="lg"
                selectedKey={
                  ["potplayer", "foobar", "aimp"].includes(platform as string)
                    ? platform
                    : "none"
                }
                size="lg"
              >
                <Tab
                  key="potplayer"
                  title={<TabTitle icon={<PlayCircleFilled style={{ fontSize: 18 }} />} label="PotPlayer" />}
                  onClick={changePlatform}
                />
                <Tab
                  key="foobar"
                  title={<TabTitle icon={<img className="h-4.5" src="/assets/foobar_icon.png" />} label="Foobar2000" />}
                  onClick={changePlatform}
                />
                <Tab
                  key="aimp"
                  title={<TabTitle icon={<img className="h-4.5" src="/assets/aimp_icon.png" />} label="AIMP" />}
                  onClick={changePlatform}
                />
              </Tabs>
            </div>
          </AnimatedRow>
          <AnimatedRow show={visibleRows.includes("other")}>
            <div className="flex flex-col gap-3 mt-4">
              <span className="text-primary-900 text-xs font-bold">其它</span>
              <Tabs
                classNames={{
                  tabList: "p-1.5",
                  tab: "h-10",
                  tabContent: "text-default-600",
                }}
                color="primary"
                fullWidth={true}
                radius="lg"
                selectedKey={
                  ["lx", "musicfree", "cider", "yesplay"].includes(
                    platform as string,
                  )
                    ? platform
                    : "none"
                }
                size="lg"
              >
                <Tab
                  key="lx"
                  title={<TabTitle icon={<img className="h-4.5" src="/assets/lx_icon.png" />} label="洛雪音乐" />}
                  onClick={changePlatform}
                />
                <Tab
                  key="musicfree"
                  title={<TabTitle icon={<img className="h-4.5" src="/assets/musicfree_icon.png" />} label="MusicFree" />}
                  onClick={changePlatform}
                />
                <Tab
                  key="cider"
                  title={<TabTitle icon={<img className="h-4.5" src="/assets/cider_icon.png" />} label="Cider" />}
                  onClick={changePlatform}
                />
                <Tab
                  key="yesplay"
                  title={<TabTitle icon={<img className="h-4.5" src="/assets/yesplay_icon.png" />} label="YesPlayMusic" />}
                  onClick={changePlatform}
                />
              </Tabs>
            </div>
          </AnimatedRow>

          <Button
            className="bg-[#27272a] mt-8 p-0"
            disableRipple={true}
            fullWidth={true}
            size="lg"
            variant="flat"
            onPress={handleExpand}
          >
            <div className="relative w-full flex justify-center items-center">
              <span>{isExpanded ? "收起" : "更多"}</span>
              <ChevronDown
                className={`absolute right-[1rem] transition-all duration-150 ${isExpanded ? "rotate-180" : ""}`}
                size={20}
              />
            </div>
          </Button>
        </div>

        <Spacer y={0} />

        {/* 系统设置 */}
        <div className="flex flex-col gap-4 font-poppins">
          <h1 className="text-xl text-default-800 font-bold leading-9">
            系统设置
          </h1>

          <h2 className="text-base text-default-800 font-bold leading-6">
            启动选项
          </h2>
          {/* 自动打开主页 */}
          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 p-0 h-16">
            <div className="flex flex-col gap-[2px]">
              <span>自动打开主页</span>
              <span className="text-color-desc text-sm">
                软件运行后自动显示主界面
              </span>
            </div>
            <Switch
              isSelected={autoLaunchHomePage}
              onValueChange={(val) => {
                setAutoLaunchHomePage(val);
                saveSettings({ autoLaunchHomePage: val });
              }}
            />
          </div>
          {/* 开机自启 */}
          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 p-0 h-16">
            <div className="flex flex-col gap-[2px]">
              <span>开机自启</span>
              <span className="text-color-desc text-sm">
                系统启动时自动运行软件
              </span>
            </div>
            <Switch
              isSelected={runAtStartup}
              onValueChange={async (val) => {
                setRunAtStartup(val);
                saveSettings({ runAtStartup: val });

                if (val) {
                  setTimeout(() => {
                    onDesktopWidgetTipModalOpen();
                  }, 500);

                  try {
                    await fetch("/api/system/enableRunAtStartup");
                  } catch (err) {
                    console.error("启用开机自启失败", err);
                  }
                } else {
                  try {
                    await fetch("/api/system/disableRunAtStartup");
                  } catch (err) {
                    console.error("禁用开机自启失败", err);
                  }
                }
              }}
            />
          </div>
          {/* 检查更新 */}
          <div className="group relative flex flex-col w-full max-w-full gap-2 my-2">
            <span className="flex items-center text-primary-900 text-xs font-bold cursor-default user-select-none">
              检查更新
            </span>
            <Select
              className="w-full font-poppins"
              classNames={{
                trigger: "cursor-pointer transition-background !duration-150",
                innerWrapper: "pl-1",
              }}
              selectedKeys={updateCheckFreq}
              size="lg"
              onSelectionChange={(keys) => {
                if (keys instanceof Set && keys.size > 0) {
                  setUpdateCheckFreq(keys);
                  saveSettings({ updateCheckFreq: Number(Array.from(keys)[0]) });
                }
              }}
            >
              <SelectItem
                key="0"
                className="h-11 mb-1 last:mb-0"
                classNames={{
                  base: "px-4",
                  title: "text-base font-poppins",
                }}
              >
                每次启动时
              </SelectItem>
              <SelectItem
                key="1"
                className="h-11 mb-1 last:mb-0"
                classNames={{
                  base: "px-4",
                  title: "text-base font-poppins",
                }}
              >
                每天
              </SelectItem>
              <SelectItem
                key="3"
                className="h-11 mb-1 last:mb-0"
                classNames={{
                  base: "px-4",
                  title: "text-base font-poppins",
                }}
              >
                每三天
              </SelectItem>
              <SelectItem
                key="5"
                className="h-11 mb-1 last:mb-0"
                classNames={{
                  base: "px-4",
                  title: "text-base font-poppins",
                }}
              >
                每五天
              </SelectItem>
              <SelectItem
                key="7"
                className="h-11 mb-1 last:mb-0"
                classNames={{
                  base: "px-4",
                  title: "text-base font-poppins",
                }}
              >
                每周
              </SelectItem>
            </Select>
          </div>

          <Divider />

          <h2 className="text-base text-default-800 font-bold leading-6">
            识别方式
          </h2>
          {/* 优先使用 SMTC */}
          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 p-0 h-16">
            <div className="flex flex-col gap-[2px]">
              <span>优先使用 SMTC</span>
              <span className="text-color-desc text-sm">
                能够保证封面和音乐软件中的完全一致
              </span>
            </div>
            <Switch
              isSelected={smtc}
              onValueChange={(val) => {
                setSmtc(val);
                saveSettings({ smtc: val });
              }}
            />
          </div>

          {/* 启用备选平台 */}
          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 p-0 h-16">
            <div className="flex flex-col gap-[2px]">
              <span>启用备选平台</span>
              <span className="text-color-desc text-sm">
                当首选音乐平台未运行时，自动识别备选平台
              </span>
            </div>
            <Switch
              isSelected={fallbackPlatformEnabled}
              onValueChange={(val) => {
                setFallbackPlatformEnabled(val);
                saveSettings({ fallbackPlatformEnabled: val });
              }}
            />
          </div>

          {/* 备选平台 */}
          <div className="group relative flex flex-col w-full max-w-full gap-2 my-2">
            <span
              className={`text-primary-900 text-xs font-bold transition-all cursor-default user-select-none ${!fallbackPlatformEnabled && "opacity-40"}`}
            >
              备选平台
            </span>
            <Select
              className="w-full font-poppins transition-all"
              classNames={{
                trigger: "cursor-pointer transition-background !duration-150",
                innerWrapper: "pl-1",
              }}
              isDisabled={!fallbackPlatformEnabled}
              scrollShadowProps={{
                isEnabled: false,
                hideScrollBar: false,
              }}
              selectedKeys={fallbackPlatform}
              size="lg"
              maxListboxHeight={420}
              onSelectionChange={(keys) => {
                if (keys instanceof Set && keys.size > 0) {
                  setFallbackPlatform(keys);
                  saveSettings({
                    fallbackPlatform: Array.from(keys)[0] as string,
                  });
                }
              }}
            >
              {Object.entries(platformGroups).map(
                ([groupKey, platformKeys], groupIndex, arr) => {
                  const isLastGroup = groupIndex === arr.length - 1;

                  return (
                    <SelectSection
                      key={groupKey}
                      classNames={{
                        heading: "px-2 leading-6 cursor-default user-select-none",
                      }}
                      showDivider={!isLastGroup}
                      title={platformGroupTitles[groupKey]}
                    >
                      {platformKeys.map((platformKey, index) => {
                        // 检查是否为最后一个元素，用于控制 margin
                        const isLast = index === platformKeys.length - 1;

                        return (
                          <SelectItem
                            key={platformKey}
                            className={`h-11 mb-1 ${isLast ? "last:mb-0" : ""}`}
                            classNames={{
                              base: "px-4",
                              title: "text-base font-poppins",
                            }}
                          >
                            {PLATFORM_MAP[platformKey]}
                          </SelectItem>
                        );
                      })}
                    </SelectSection>
                  );
                },
              )}
            </Select>
          </div>

          <Divider />

          <h2 className="text-base text-default-800 font-bold leading-6">
            检测配置
          </h2>
          {/* 检测频率 */}
          <div className="group relative flex flex-col w-full max-w-full gap-2 my-2">
            <span className="flex items-center text-primary-900 text-xs font-bold cursor-default user-select-none">
              检测频率
              <Tooltip
                className="px-3 font-poppins"
                closeDelay={200}
                content="频率越快，实时性越高，歌曲时间越精确（默认为 100 ms）"
                delay={200}
                placement="right"
              >
                <InfoCircle className="ml-1" size={14} />
              </Tooltip>
            </span>
            <Select
              className="w-full font-poppins"
              classNames={{
                trigger: "cursor-pointer transition-background !duration-150",
                innerWrapper: "pl-1",
              }}
              selectedKeys={pollInterval}
              size="lg"
              onSelectionChange={(keys) => {
                if (keys instanceof Set && keys.size > 0) {
                  setPollInterval(keys);
                  saveSettings({ pollInterval: Number(Array.from(keys)[0]) });
                }
              }}
            >
              <SelectItem
                key="100"
                className="h-11 mb-1 last:mb-0"
                classNames={{
                  base: "px-4",
                  title: "text-base font-poppins",
                }}
              >
                100 ms（最快）
              </SelectItem>
              <SelectItem
                key="200"
                className="h-11 mb-1 last:mb-0"
                classNames={{
                  base: "px-4",
                  title: "text-base font-poppins",
                }}
              >
                200 ms（极快）
              </SelectItem>
              <SelectItem
                key="300"
                className="h-11 mb-1 last:mb-0"
                classNames={{
                  base: "px-4",
                  title: "text-base font-poppins",
                }}
              >
                300 ms（快速）
              </SelectItem>
              <SelectItem
                key="500"
                className="h-11 mb-1 last:mb-0"
                classNames={{
                  base: "px-4",
                  title: "text-base font-poppins",
                }}
              >
                500 ms（中速）
              </SelectItem>
              <SelectItem
                key="1000"
                className="h-11 mb-1 last:mb-0"
                classNames={{
                  base: "px-4",
                  title: "text-base font-poppins",
                }}
              >
                1000 ms（慢速）
              </SelectItem>
            </Select>
          </div>
        </div>

        <Spacer y={2} />

        {/* 音频设备帮助模态框 */}
        <Modal
          isOpen={isDeviceHelpModalOpen}
          onOpenChange={onDeviceHelpModalOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  如何选择音频设备？
                </ModalHeader>
                <ModalBody>
                  <p className="leading-7">
                    打开音乐软件的设置，找到
                    "输出设备"。您只需确保此处选择的音频设备与音乐软件中的输出设备一致即可。
                  </p>
                  <Spacer y={1} />
                  <Image alt="音频设备帮助" src="/assets/device-help.png" />
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

        {/* 智能识别模态框 */}
        <Modal
          isOpen={isDeviceDetectModalOpen}
          onOpenChange={onDeviceDetectModalOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">提示</ModalHeader>
                <ModalBody>
                  <p className="leading-7">
                    在开始识别前，请确保您正在使用{" "}
                    <Code className="font-poppins" color="primary">
                      {PLATFORM_MAP[platform ?? "netease"] ??
                        "当前选择的音乐软件"}
                    </Code>{" "}
                    播放任意歌曲。
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="flat" onPress={onClose}>
                    取消
                  </Button>
                  <Button
                    color="primary"
                    isLoading={isDetecting}
                    onPress={async () => {
                      setIsDetecting(true);

                      await delay(1000);

                      try {
                        const response = await fetch(
                          `/api/audio/deviceDetect?platform=${encodeURIComponent(platform ?? "")}`,
                        );

                        if (!response.ok) {
                          throw new Error(
                            `HTTP 响应错误！状态码：${response.status}`,
                          );
                        }

                        const data = await response.json();
                        const result = data.data;

                        if (result.startsWith("Fail")) {
                          // 检测失败
                          throw new Error(result);
                        } else if (result.startsWith("None")) {
                          // 未检测到
                          onDeviceDetectNoneModalOpen();
                        } else {
                          // 检测成功
                          setDeviceId(new Set([result]));
                          saveSettings({
                            deviceId: result,
                            deviceName:
                              devices.find((d) => d.key === result)?.label ??
                              "主声音驱动程序",
                          });

                          setTimeout(() => {
                            addToast({
                              title: "识别成功",
                              description: "音频设备已自动设置",
                              color: "success",
                              timeout: 3000,
                            });
                          }, 500);
                        }
                      } catch (error: any) {
                        console.error("智能识别失败：", error);
                        addToast({
                          title: "识别失败",
                          description: error.message,
                          color: "danger",
                          timeout: 6000,
                        });
                      } finally {
                        onClose();
                        setIsDetecting(false);
                      }
                    }}
                  >
                    {isDetecting ? "识别中" : "开始识别"}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* 智能识别未检测到模态框 */}
        <Modal
          isOpen={isDeviceDetectNoneModalOpen}
          size="sm"
          onOpenChange={onDeviceDetectNoneModalOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex items-center gap-2">
                  <DangerTriangle className="translate-y-[1px]" size={22} />
                  未识别到音乐
                </ModalHeader>
                <ModalBody>
                  <p className="leading-7">
                    当前未检测到任何音乐正在播放，请您根据实际情况做出选择：
                  </p>
                </ModalBody>
                <ModalFooter>
                  <div className="w-full flex flex-col gap-4 my-4">
                    <Button
                      fullWidth={true}
                      variant="bordered"
                      onPress={async () => {
                        onClose();
                        addToast({
                          title: "重新识别",
                          description: "请确保音乐正在播放后重试",
                          color: "warning",
                          timeout: 3000,
                        });

                        await delay(2500);

                        onDeviceDetectModalOpen();
                      }}
                    >
                      <span className="font-poppins">
                        我没有使用
                        {PLATFORM_MAP[platform ?? "netease"] ?? "音乐软件"}
                        播放歌曲
                      </span>
                    </Button>
                    <Button
                      fullWidth={true}
                      variant="bordered"
                      onPress={async () => {
                        onClose();
                        addToast({
                          title: "识别失败",
                          description: "请手动选择音频设备",
                          color: "warning",
                          timeout: 3000,
                        });

                        await delay(2500);

                        onDeviceHelpModalOpen();
                      }}
                    >
                      <span className="font-poppins">
                        我正在使用
                        {PLATFORM_MAP[platform ?? "netease"] ?? "音乐软件"}
                        播放歌曲
                      </span>
                    </Button>
                  </div>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* 桌面组件小提示模态框 */}
        <Modal
          isOpen={isDesktopWidgetTipModalOpen}
          onOpenChange={onDesktopWidgetTipModalOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">提示</ModalHeader>
                <ModalBody>
                  <ul className="list-disc flex flex-col gap-2 ml-4">
                    <li className="ps-1 leading-8">
                      如果您开启了桌面组件，建议在{" "}
                      <a
                        className="custom-underline font-bold"
                        href="/settings/widget"
                      >
                        歌曲组件
                      </a>{" "}
                      设置中勾选 "暂停时隐藏" 选项。
                    </li>
                    <li className="ps-1 leading-8">
                      这样一来，在没有播放音乐的情况下，桌面组件便会自动隐藏。
                    </li>
                  </ul>
                  <Spacer y={1} />
                  <Image
                    alt="桌面组件小提示"
                    src="/assets/desktop-widget-tip.png"
                  />
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

        {/* 使用帮助 */}
        <PlatformHelpDrawer
          isConnected={isConnected}
          isOpen={isPlatformHelpOpen}
          platform={platform ?? "netease"}
          smtc={smtc ?? true}
          onOpenChange={onPlatformHelpOpenChange}
        />
      </div>
    </div>
  );
}
