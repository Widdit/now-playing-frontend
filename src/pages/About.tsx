import React, { useEffect, useState, useRef } from "react";
import { Tooltip } from "@heroui/tooltip";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { QqOutlined, GithubFilled } from "@ant-design/icons";
import { Divider } from "@heroui/divider";
import { Card, CardBody } from "@heroui/card";
import { Image } from "@heroui/image";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { addToast, closeAll } from "@heroui/toast";

import { versionCompare } from "@/utils/versionCompare";

import { Check } from "@mynaui/icons-react";

import { PLATFORM_MAP } from "@/constants/platformMap";

import { useDisclosure } from "@heroui/use-disclosure";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Code } from "@heroui/code";
import hljs from "highlight.js";
import "highlight.js/styles/vs2015.css";
import html2canvas from "html2canvas";

import { useSocialInfo } from "@/hooks/useSocialInfo";
import { CURRENT_VERSION } from "@/constants/version";
import GitHubButton from "@/components/GithubButton";
import { BilibiliIcon } from "@/components/Icons";
import { siteConfig } from "@/constants/site";
import { Spacer } from "@heroui/spacer";
import { useOpenExternalUrl } from "@/hooks/useOpenExternalUrl";

interface VersionData {
  latestVersion: string;
  updateLog?: string;
}

interface AppInfo {
  operatingSystem: string;
  osBit: number;
  installPath: string;
  programRunningTime: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  smtc: boolean;
  runAtStartup: boolean;
  autoLaunchHomePage: boolean;
  updateCheckFreq: number;
  fallbackPlatformEnabled: boolean;
  fallbackPlatform: string;
  pollInterval: number;
  lyricSource: string;
  autoSelectBestLyric: boolean;
}

interface GeneralSettings {
  deviceId: string;
  deviceName: string;
  platform: string;
  autoLaunchHomePage: boolean;
  smtc: boolean;
  runAtStartup: boolean;
}

interface LogStatus {
  mainLogExist: boolean;
  desktopLogExist: boolean;
  virtualCameraLogExist: boolean;
}

export default function AboutPage() {
  const { socialInfo } = useSocialInfo();
  const [appInfoCopyState, setAppInfoCopyState] = useState<boolean>(false);
  const [installPath, setInstallPath] = useState("");
  const [platformName, setPlatformName] = useState("当前选择的音乐软件");
  const [logStatus, setLogStatus] = useState<LogStatus>({
    mainLogExist: false,
    desktopLogExist: false,
    virtualCameraLogExist: false,
  });

  const [logContent, setLogContent] = useState("");
  const codePreviewRef = useRef<HTMLPreElement>(null);

  const { openExternalUrl } = useOpenExternalUrl();

  const {
    isOpen: isLogModalOpen,
    onOpen: onLogModalOpen,
    onOpenChange: onLogModalOpenChange,
  } = useDisclosure();

  const {
    isOpen: isDeviceTestModalOpen,
    onOpen: onDeviceTestModalOpen,
    onOpenChange: onDeviceTestModalOpenChange,
  } = useDisclosure();

  const {
    isOpen: isSmtcTestModalOpen,
    onOpen: onSmtcTestModalOpen,
    onOpenChange: onSmtcTestModalOpenChange,
  } = useDisclosure();

  // 获取软件安装目录
  useEffect(() => {
    fetch("/api/system/installPath")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP 响应错误！状态码：${res.status}`);
        }

        return res.json();
      })
      .then((resObj) => {
        setInstallPath(resObj.data);
      })
      .catch((err) => {
        console.error("获取安装目录失败", err);
        addToast({
          title: "获取安装目录失败",
          description: err.message,
          color: "danger",
          timeout: 6000,
        });
      });
  }, []);

  // 获取日志文件状态
  useEffect(() => {
    fetch("/api/system/logStatus")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP 响应错误！状态码：${res.status}`);
        }

        return res.json();
      })
      .then((resObj) => {
        setLogStatus(resObj);
      })
      .catch((err) => {
        console.error("获取日志状态失败", err);
        addToast({
          title: "获取日志状态失败",
          description: err.message,
          color: "danger",
          timeout: 6000,
        });
      });
  }, []);

  // 复制日志图片
  const copyLogAsImage = async () => {
    if (!codePreviewRef.current) return;

    try {
      // 创建临时容器用于生成图片
      const tempContainer = document.createElement("div");

      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.width = "auto";
      tempContainer.style.whiteSpace = "nowrap";

      // 克隆预览元素
      const tempPreview = codePreviewRef.current.cloneNode(
        true,
      ) as HTMLPreElement;

      // 应用固定样式
      tempPreview.style.fontFamily = "Consolas, monospace";
      tempPreview.style.fontSize = "14px";
      tempPreview.style.backgroundColor = "#18181b";
      tempPreview.style.color = "#DCDCDC";
      tempPreview.style.padding = "20px";
      tempPreview.style.borderRadius = "8px";

      tempContainer.appendChild(tempPreview);
      document.body.appendChild(tempContainer);

      // 生成图片
      const canvas = await html2canvas(tempPreview, {
        backgroundColor: "#18181b",
        scale: 2,
        scrollX: 0,
        scrollY: 0,
      });

      // 移除临时容器
      document.body.removeChild(tempContainer);

      // 复制到剪贴板
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });

      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);

        addToast({
          title: "复制成功",
          description: "日志图片已复制到剪贴板",
          color: "success",
          timeout: 3000,
        });
      }
    } catch (err: any) {
      console.error("生成或复制图片失败", err);
      addToast({
        title: "复制失败",
        description: `操作失败: ${err.message}`,
        color: "danger",
        timeout: 6000,
      });
    }
  };

  // 当日志内容变化时应用语法高亮
  useEffect(() => {
    if (codePreviewRef.current && logContent) {
      const maxCharacters = 190; // 限制每行最大字符数
      const lines = logContent.split("\n");
      const truncatedLines = lines.map((line) =>
        line.length > maxCharacters
          ? line.substring(0, maxCharacters) + "..."
          : line,
      );
      const truncatedText = truncatedLines.join("\n");

      codePreviewRef.current.textContent = truncatedText;
      hljs.highlightElement(codePreviewRef.current);
    }
  }, [logContent, isLogModalOpen]);

  // 获取平台名称
  const getPlatformName = async () => {
    try {
      const response = await fetch("/api/settings/general");

      if (!response.ok) {
        throw new Error(`HTTP 响应错误！状态码：${response.status}`);
      }

      const data: GeneralSettings = await response.json();

      setPlatformName(PLATFORM_MAP[data.platform] ?? data.platform);
    } catch (error) {
      console.error("获取平台名称失败：", error);
    }
  };

  // 打开日志文件
  const openLogFile = async (logType: string) => {
    const params = new URLSearchParams();

    params.append("logType", logType);

    try {
      await fetch(`/api/system/openLogFile?${params.toString()}`);
    } catch (err) {
      console.error("打开日志文件失败", err);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-full max-w-[800px] py-6 px-10 gap-6">
        <h1 className="text-3xl text-white font-bold leading-9">关于</h1>

        {/* 关于软件 */}
        <div className="flex flex-col gap-4 font-poppins">
          <h1 className="text-xl text-default-800 font-bold leading-9">
            关于软件
          </h1>

          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 h-16">
            <div className="flex items-center text-foreground text-base gap-4">
              <img height={48} src="/assets/nowplaying.ico" width={48} />
              <div className="flex flex-col font-poppins gap-[2px]">
                <span className="font-semibold">Now Playing</span>
                <span className="text-default-500 text-sm">
                  版本：{CURRENT_VERSION}
                </span>
              </div>
            </div>
            <Button
              color="primary"
              onPress={() => {
                fetch("/api/version")
                  .then((response) => {
                    if (!response.ok) {
                      throw new Error(
                        `HTTP 响应错误！状态码：${response.status}`,
                      );
                    }

                    return response.json();
                  })
                  .then((data: VersionData) => {
                    if (data.latestVersion) {
                      if (versionCompare(data.latestVersion, CURRENT_VERSION) <= 0) {
                        addToast({
                          color: "success",
                          title: "版本信息",
                          description: "当前已是最新版本",
                          timeout: 6000,
                        });
                      } else {
                        addToast({
                          color: "warning",
                          title: "版本信息",
                          description: `检测到新版本 ${data.latestVersion} 可用`,
                          timeout: 6000,
                          endContent: (
                            <Button
                              color="warning"
                              size="sm"
                              variant="solid"
                              onPress={() => {
                                closeAll();
                                openExternalUrl(siteConfig.links.download);
                              }}
                            >
                              下载
                            </Button>
                          ),
                        });
                      }
                    }
                  })
                  .catch((error) => {
                    console.error("获取版本信息出错:", error);
                    addToast({
                      title: "获取版本信息失败",
                      description: error.message,
                      color: "danger",
                      timeout: 6000,
                    });
                  });
              }}
            >
              检查更新
            </Button>
          </div>

          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 h-16">
            <div className="flex flex-col gap-[2px]">
              <span>软件信息</span>
              <span className="text-color-desc text-sm">
                将关键信息提供给开发者以更好地解决问题
              </span>
            </div>
            <Button
              className="text-foreground"
              color={appInfoCopyState ? "success" : "default"}
              variant={appInfoCopyState ? "solid" : "ghost"}
              onPress={async () => {
                if (appInfoCopyState) {
                  return;
                }

                try {
                  const res = await fetch("/api/system/appInfo");

                  if (!res.ok) {
                    throw new Error(`HTTP 响应错误！状态码：${res.status}`);
                  }

                  setAppInfoCopyState(true);
                  setTimeout(() => {
                    setAppInfoCopyState(false);
                  }, 1500);

                  const data: AppInfo = await res.json();

                  const platformName = PLATFORM_MAP[data.platform] ?? data.platform;
                  const fallbackPlatformName = PLATFORM_MAP[data.fallbackPlatform] ?? data.fallbackPlatform;

                  const str = `
基本信息：
- 软件版本：${CURRENT_VERSION}
- 操作系统：${data.operatingSystem}
- 系统位数：${data.osBit} 位
- 安装路径：${data.installPath}
- 运行时长：${data.programRunningTime}

通用设置：
- 音乐平台：${platformName}
- 音频设备：${data.deviceName}
- 优先使用 SMTC：${data.smtc ? "开启" : "关闭"}
- 开机自启：${data.runAtStartup ? "开启" : "关闭"}
- 自动打开主页：${data.autoLaunchHomePage ? "开启" : "关闭"}
- 检查更新频率：${data.updateCheckFreq > 0 ? "每 " + data.updateCheckFreq + " 天" : "每次启动时"}
- 启用备选音乐平台：${data.fallbackPlatformEnabled ? "开启" : "关闭"}
- 备选音乐平台：${fallbackPlatformName}
- 检测频率：${data.pollInterval} ms

歌词设置：
- 歌词源：${PLATFORM_MAP[data.lyricSource] ?? data.lyricSource}
- 智能匹配最佳歌词：${data.autoSelectBestLyric ? "开启" : "关闭"}
                  `.trim();

                  navigator.clipboard.writeText(str);
                } catch (err: any) {
                  console.error("获取软件信息失败", err);
                  addToast({
                    title: "获取软件信息失败",
                    description: err.message,
                    color: "danger",
                    timeout: 6000,
                  });
                }
              }}
            >
              {appInfoCopyState ? <Check stroke={2} /> : "复制"}
            </Button>
          </div>

          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 h-16">
            <div className="flex flex-col gap-[2px]">
              <span>开源地址</span>
              <Link
                className="text-color-desc text-sm cursor-pointer"
                color="foreground"
                onPress={() => {openExternalUrl(siteConfig.links.github);}}
              >
                {siteConfig.links.github}
              </Link>
            </div>
            <GitHubButton
              stars={socialInfo.githubStars}
              onClick={() => {
                openExternalUrl(siteConfig.links.github);
              }}
            />
          </div>

          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 h-16">
            <div className="flex flex-col gap-[2px]">
              <span>社区交流</span>
              <span className="text-color-desc text-sm">
                加入交流群反馈使用体验与建议
              </span>
            </div>
            <div className="flex gap-3">
              <Tooltip
                closeDelay={200}
                content="极海HEX"
                placement="left"
                className="px-3 font-poppins"
              >
                <Button
                  isIconOnly
                  color="primary"
                  variant="flat"
                  onPress={() => {
                    openExternalUrl(siteConfig.links.bilibili);
                  }}
                >
                  <BilibiliIcon size={17} />
                </Button>
              </Tooltip>
              <Tooltip
                closeDelay={200}
                content={socialInfo.qqGroupNumber}
                placement="right"
                className="px-3 font-poppins"
              >
                <Button
                  isIconOnly
                  color="primary"
                  variant="flat"
                  onPress={() => {
                    openExternalUrl(socialInfo.qqGroupLink);
                  }}
                >
                  <QqOutlined style={{ fontSize: "17px" }} />
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>

        <Divider />

        {/* 调试 */}
        <div className="flex flex-col gap-4 font-poppins">
          <h1 className="text-xl text-default-800 font-bold leading-9">调试</h1>

          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 h-16">
            <div className="flex flex-col gap-[2px]">
              <span>软件安装目录</span>
              <span className="text-color-desc text-sm min-h-[1.25rem]">
                {installPath || ""}
              </span>
            </div>
            <Button
              variant="ghost"
              onPress={async () => {
                try {
                  await fetch("/api/system/openInstallPath");
                } catch (err) {
                  console.error("打开软件安装目录失败", err);
                }
              }}
            >
              打开
            </Button>
          </div>

          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 h-16">
            <div className="flex flex-col gap-[2px]">
              <span>日志信息</span>
              <span className="text-color-desc text-sm">
                根据日志信息一键生成便于阅读的图片
              </span>
            </div>
            <Button
              variant="ghost"
              onPress={() => {
                // 先清空现有内容
                setLogContent("");
                fetch("/api/system/log/mainContent")
                  .then((res) => {
                    if (!res.ok) {
                      throw new Error(`HTTP 响应错误！状态码：${res.status}`);
                    }

                    return res.json();
                  })
                  .then((resObj) => {
                    setLogContent(resObj.data || "");
                    onLogModalOpen();
                  })
                  .catch((err) => {
                    console.error("获取日志信息失败", err);
                    addToast({
                      title: "获取日志信息失败",
                      description: err.message,
                      color: "danger",
                      timeout: 6000,
                    });
                  });
              }}
            >
              查看
            </Button>
          </div>

          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 h-16">
            <div className="flex flex-col gap-[2px]">
              <span>音频设备调试程序</span>
              <span className="text-color-desc text-sm">
                测试此系统的音频设备情况
              </span>
            </div>
            <Button
              variant="ghost"
              onPress={async () => {
                await getPlatformName();
                onDeviceTestModalOpen();
              }}
            >
              运行
            </Button>
          </div>

          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 h-16">
            <div className="flex flex-col gap-[2px]">
              <span>SMTC 调试程序</span>
              <span className="text-color-desc text-sm">
                测试此设备的系统媒体控制功能
              </span>
            </div>
            <Button
              variant="ghost"
              onPress={async () => {
                await getPlatformName();
                onSmtcTestModalOpen();
              }}
            >
              运行
            </Button>
          </div>

          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 h-16">
            <div className="flex flex-col gap-[2px]">
              <span>日志文件</span>
              <span className="text-color-desc text-sm">
                向开发者提供日志文件，有助于问题得到更妥善的解决
              </span>
            </div>
            <Dropdown classNames={{ content: "min-w-0 w-38" }}>
              <DropdownTrigger>
                <Button variant="ghost">打开</Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem
                  key="main"
                  className={logStatus.mainLogExist ? "block" : "hidden"}
                  onPress={async () => openLogFile("main")}
                >
                  软件主日志
                </DropdownItem>
                <DropdownItem
                  key="desktop"
                  className={
                    logStatus.desktopLogExist ? "block" : "hidden"
                  }
                  onPress={async () => openLogFile("desktop")}
                >
                  桌面端日志
                </DropdownItem>
                <DropdownItem
                  key="camera"
                  className={
                    logStatus.virtualCameraLogExist ? "block" : "hidden"
                  }
                  onPress={async () => openLogFile("camera")}
                >
                  虚拟摄像头日志
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        <Divider />

        {/* 致谢 */}
        <div className="flex flex-col gap-4">
          <h1 className="text-xl text-default-800 font-bold leading-9">致谢</h1>

          <div className="flex flex-col sm:flex-row gap-4">
            <Card className="w-full min-w-0">
              <CardBody className="flex flex-row gap-3 items-center overflow-hidden">
                <div className="w-[32px] h-[32px] shrink-0 flex-none flex items-center justify-center">
                  <Image
                    className="shrink-0"
                    height={32}
                    radius="sm"
                    src="/assets/6k_logo_white_ico.svg"
                    width={32}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-md truncate whitespace-nowrap">6K Labs</p>
                  <Link
                    className="text-color-desc text-sm truncate whitespace-nowrap block cursor-pointer"
                    color="foreground"
                    onPress={() => {openExternalUrl("https://6klabs.com");}}
                  >
                    6klabs.com
                  </Link>
                </div>
              </CardBody>
              <Divider />
              <CardBody className="flex flex-row gap-3 items-center overflow-hidden">
                <div className="w-[32px] h-[32px] shrink-0 flex-none flex items-center justify-center">
                  <Image
                    className="scale-115 shrink-0"
                    height={32}
                    radius="sm"
                    src="/assets/heroui.png"
                    width={32}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-md truncate whitespace-nowrap">HeroUI</p>
                  <Link
                    className="text-color-desc text-sm truncate whitespace-nowrap block cursor-pointer"
                    color="foreground"
                    onPress={() => {openExternalUrl("https://heroui.com");}}
                  >
                    heroui.com
                  </Link>
                </div>
              </CardBody>
              <Divider />
              <CardBody className="flex flex-row gap-3 items-center overflow-hidden">
                <div className="w-[32px] h-[32px] shrink-0 flex-none flex items-center justify-center">
                  <Image
                    className="shrink-0"
                    height={32}
                    radius="sm"
                    src="/assets/tauri.png"
                    width={32}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-md truncate whitespace-nowrap">Tauri</p>
                  <Link
                    className="text-color-desc text-sm truncate whitespace-nowrap block cursor-pointer"
                    color="foreground"
                    onPress={() => {openExternalUrl("https://tauri.app");}}
                  >
                    tauri.app
                  </Link>
                </div>
              </CardBody>
            </Card>
            <Card className="w-full min-w-0">
              <CardBody className="flex flex-row gap-3 items-center overflow-hidden">
                <div className="w-[32px] h-[32px] shrink-0 flex-none flex items-center justify-center">
                  <Image
                    className="scale-110 shrink-0"
                    height={32}
                    radius="sm"
                    src="/assets/AMLLPlayer.png"
                    width={32}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-md truncate whitespace-nowrap">AMLL</p>
                  <Link
                    className="text-color-desc text-sm truncate whitespace-nowrap block cursor-pointer"
                    color="foreground"
                    onPress={() => {openExternalUrl("https://github.com/amll-dev/applemusic-like-lyrics");}}
                  >
                    github.com/amll-dev
                  </Link>
                </div>
              </CardBody>
              <Divider />
              <CardBody className="flex flex-row gap-3 items-center overflow-hidden">
                <div className="w-[32px] h-[32px] shrink-0 flex-none flex items-center justify-center">
                  <GithubFilled className="shrink-0" style={{ fontSize: 32 }} />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-md truncate whitespace-nowrap">Softcam</p>
                  <Link
                    className="text-color-desc text-sm truncate whitespace-nowrap block cursor-pointer"
                    color="foreground"
                    onPress={() => {openExternalUrl("https://github.com/tshino/softcam");}}
                  >
                    github.com/tshino/softcam
                  </Link>
                </div>
              </CardBody>
              <Divider />
              <CardBody className="flex flex-row gap-3 items-center overflow-hidden">
                <div className="w-[32px] h-[32px] shrink-0 flex-none flex items-center justify-center">
                  <Image
                    className="shrink-0"
                    height={32}
                    radius="sm"
                    src="/assets/ShaderGradient.png"
                    width={32}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-md truncate whitespace-nowrap">ShaderGradient</p>
                  <Link
                    className="text-color-desc text-sm truncate whitespace-nowrap block cursor-pointer"
                    color="foreground"
                    onPress={() => {openExternalUrl("https://shadergradient.co");}}
                  >
                    shadergradient.co
                  </Link>
                </div>
              </CardBody>
            </Card>
          </div>
          <blockquote className="border px-4 py-3 rounded-xl border-default-200 dark:border-default-100 bg-content1">
            <p>
              感谢所有列出的和未能列出的开源依赖，以及长久以来支持{" "}
              <span className="font-poppins">Now Playing</span> 的用户 ✨
            </p>
          </blockquote>
        </div>

        <Spacer y={0} />

        {/* 日志信息模态框 */}
        <Modal
          isOpen={isLogModalOpen}
          scrollBehavior="inside"
          size="5xl"
          onOpenChange={onLogModalOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  日志信息
                </ModalHeader>
                <ModalBody>
                  <div className="relative">
                    <pre
                      ref={codePreviewRef}
                      className="language-yaml text-sm font-consolas bg-[#18181b]!"
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button
                    color="default"
                    variant="flat"
                    onPress={async () => {
                      try {
                        await navigator.clipboard.writeText(logContent);

                        addToast({
                          title: "复制成功",
                          description: "日志文本已复制到剪贴板",
                          color: "success",
                          timeout: 3000,
                        });
                      } catch (err: any) {
                        console.error("复制文本失败", err);
                        addToast({
                          title: "复制失败",
                          description: `操作失败: ${err.message}`,
                          color: "danger",
                          timeout: 6000,
                        });
                      }
                      onClose();
                    }}
                  >
                    复制文本
                  </Button>
                  <Button
                    color="primary"
                    onPress={() => {
                      copyLogAsImage();
                      setTimeout(() => {
                        onClose();
                      }, 200);
                    }}
                  >
                    复制图片
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* 音频设备调试程序模态框 */}
        <Modal
          isOpen={isDeviceTestModalOpen}
          onOpenChange={onDeviceTestModalOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">提示</ModalHeader>
                <ModalBody>
                  <p className="leading-7">
                    在运行调试程序之前，请确保您正在使用{" "}
                    <Code className="font-poppins" color="primary">
                      {platformName}
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
                    onPress={async () => {
                      try {
                        await fetch("/api/system/runDeviceVolumeTest");
                      } catch (err) {
                        console.error("运行音频设备调试程序失败", err);
                      }
                      onClose();
                    }}
                  >
                    确定
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* SMTC 调试程序模态框 */}
        <Modal
          isOpen={isSmtcTestModalOpen}
          onOpenChange={onSmtcTestModalOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">提示</ModalHeader>
                <ModalBody>
                  <p className="leading-7">
                    在运行调试程序之前，请确保您正在使用{" "}
                    <Code className="font-poppins" color="primary">
                      {platformName}
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
                    onPress={async () => {
                      try {
                        await fetch("/api/system/runSmtcTest");
                      } catch (err) {
                        console.error("运行 SMTC 调试程序失败", err);
                      }
                      onClose();
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
    </div>
  );
}
