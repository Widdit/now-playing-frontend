import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import { Rocket } from "@mynaui/icons-react";
import { Megaphone } from "lucide-react";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/use-disclosure";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import ReactMarkdown from "react-markdown";
import "@/styles/markdown.css";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/vs2015.css";

import { CURRENT_VERSION } from "@/constants/version";
import testVersionData from "@/constants/test/version.json";
import testAnnouncementData from "@/constants/test/announcement.json";
import { versionCompare } from "@/utils/versionCompare";
import TitleBar from "@/components/TitleBar";
import { useEnv } from "@/contexts/EnvContext";
import { useOpenExternalUrl } from "@/hooks/useOpenExternalUrl";
import { timeSince } from "@/utils/timeSince";

interface VersionData {
  latestVersion: string;
  timestamp: number;
  updateLog?: string;
}

interface AnnouncementData {
  title: string;
  timestamp: number;
  content?: string;
}

export default function IndexPage() {
  /**
   * 测试开关：true 为开启测试模式（使用本地 JSON），false 为生产模式（请求后端接口）
   */
  const IS_VERSION_TEST_MODE = false;
  const IS_ANNOUNCEMENT_TEST_MODE = false;

  const { isDesktop } = useEnv();
  const { openExternalUrl } = useOpenExternalUrl();
  const [searchParams] = useSearchParams();

  const showAnnouncement = searchParams.has("showAnnouncement");
  const showUpdate = searchParams.has("showUpdate");

  const [announcementClosed, setAnnouncementClosed] = useState(false);

  const navigate = useNavigate();
  const [versionInfo, setVersionInfo] = useState<{
    current: string;
    latest?: string;
    updateLog?: string;
    isLatest: boolean;
    latestTimestamp: number;
  }>({
    current: CURRENT_VERSION,
    isLatest: true,
    latestTimestamp: Date.now(),
  });
  const [announcementInfo, setAnnouncementInfo] = useState<AnnouncementData>({
    title: "",
    timestamp: Date.now(),
    content: "",
  });

  const {
    isOpen: isUpdateModalOpen,
    onOpen: onUpdateModalOpen,
    onOpenChange: onUpdateModalOpenChange,
  } = useDisclosure();

  const {
    isOpen: isAnnouncementModalOpen,
    onOpen: onAnnouncementModalOpen,
    onOpenChange: onAnnouncementModalOpenChange,
  } = useDisclosure();

  // 获取公告信息
  useEffect(() => {
    // 只有当 URL 有 showAnnouncement 参数时才获取公告
    if (!showAnnouncement) {
      return;
    }

    const fetchAnnouncementInfo = async () => {
      try {
        let data: AnnouncementData;

        if (IS_ANNOUNCEMENT_TEST_MODE) {
          // 测试模式：直接使用本地 JSON 文件作为响应结果
          data = testAnnouncementData as unknown as AnnouncementData;
        } else {
          // 正常模式：向后端发送请求
          const response = await fetch("/api/announcement");
          if (!response.ok) {
            throw new Error("公告信息获取失败");
          }
          data = await response.json();
        }

        setAnnouncementInfo({
          title: data.title,
          timestamp: data.timestamp,
          content: data.content,
        });

        // 弹出公告模态框
        onAnnouncementModalOpen();
      } catch (error) {
        console.error("获取公告信息出错:", error);
      }
    };

    fetchAnnouncementInfo();
  }, [showAnnouncement]);

  // 获取版本信息
  useEffect(() => {
    // 如果 URL 有 showAnnouncement 参数，需要等待公告模态框关闭后才获取版本信息
    if (showAnnouncement && !announcementClosed) {
      return;
    }

    const fetchVersionInfo = async () => {
      try {
        let data: VersionData;

        if (IS_VERSION_TEST_MODE) {
          // 测试模式：直接使用本地 JSON 文件作为响应结果
          data = testVersionData as unknown as VersionData;
        } else {
          // 正常模式：向后端发送请求
          const response = await fetch("/api/version");
          if (!response.ok) {
            throw new Error("版本信息获取失败");
          }
          data = await response.json();
        }

        if (data.latestVersion) {
          const isLatest =
            versionCompare(data.latestVersion, CURRENT_VERSION) <= 0;

          setVersionInfo({
            current: CURRENT_VERSION,
            latest: data.latestVersion,
            updateLog: data.updateLog,
            isLatest,
            latestTimestamp: data.timestamp,
          });

          // 如果当前版本不是最新，且 URL 有 showUpdate 参数，则弹出更新模态框
          if (!isLatest && showUpdate) {
            onUpdateModalOpen();
          }
        }
      } catch (error) {
        console.error("获取版本信息出错:", error);
      }
    };

    fetchVersionInfo();
  }, [showAnnouncement, announcementClosed]);

  // 进入设置页面
  const jumpToSettings = () => {
    document.body.classList.add("fade-out");

    setTimeout(() => {
      navigate("/settings/general");

      setTimeout(() => {
        if (document.body.classList.contains("fade-out")) {
          window.location.reload();
        }
      }, 300);
    }, 500);
  };

  return (
    <>
      {isDesktop && <TitleBar autoHide={false} />}

      <div>
        <style>
          {`
          :root {
            --button-color: #4055ff;
          }

          body {
            background: #0f0f0f;
          }

          #title {
            font-size: 60px;
            color: white;
            user-select: none;
            line-height: 3rem;
            z-index: 5;
            transform: translateY(-10px);
          }

          #now-playing-text {
            color: #ffffff;
            font-weight: normal;
            margin: 0 0.75rem;
            user-select: none;
          }

          #shader-gradient {
            width: 100vw;
            z-index: 0;
          }

          body.fade-out {
            animation: dissolve 0.5s forwards;
          }

          @keyframes dissolve {
            0% {
              filter: blur(0) brightness(1) hue-rotate(0deg) saturate(100%) contrast(100%) drop-shadow(0 0 0 rgba(255, 255, 255, 0));
            }

            25% {
              filter: blur(2px) brightness(1.8) hue-rotate(30deg) saturate(125%) contrast(125%) drop-shadow(0 0 6px #ff00ff);
            }

            50% {
              filter: blur(8px) brightness(2.2) hue-rotate(0deg) saturate(150%) contrast(150%) drop-shadow(0 0 12px #00ffff);
            }

            75% {
              filter: blur(12px) brightness(1.2) hue-rotate(-30deg) saturate(100%) contrast(100%) drop-shadow(0 0 16px #ffff00);
            }

            100% {
              filter: blur(20px) brightness(0) hue-rotate(0deg) saturate(0%) contrast(100%) drop-shadow(0 0 0 rgba(255, 255, 255, 0));
            }
          }

          #current-version-div, #update-text {
            user-select: none;
          }

          /* 动画按钮样式 */
          .animated-button {
            position: relative;
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 16px 36px;
            border: 4px solid;
            border-color: transparent;
            font-size: 16px;
            background-color: inherit;
            border-radius: 100px;
            font-weight: 600;
            color: var(--button-color);
            box-shadow: 0 0 0 2px var(--button-color);
            cursor: pointer;
            overflow: hidden;
            transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
            mix-blend-mode: plus-lighter;
            filter: brightness(2.0) saturate(1.2);
            transform: translateY(-10px);
          }
          .animated-button svg {
            position: absolute;
            width: 24px;
            fill: var(--button-color);
            z-index: 9;
            transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
          }
          .animated-button .arr-1 {
            right: 16px;
          }
          .animated-button .arr-2 {
            left: -25%;
          }
          .animated-button .button-circle {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            background-color: var(--button-color);
            border-radius: 50%;
            opacity: 0;
            transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
          }
          .animated-button .button-text {
            position: relative;
            z-index: 1;
            transform: translateX(-12px);
            transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
          }
          .animated-button:hover {
            box-shadow: 0 0 0 12px transparent;
            color: #0f0f0f;
            border-radius: 100px;
          }
          .animated-button:hover .arr-1 {
            right: -25%;
          }
          .animated-button:hover .arr-2 {
            left: 16px;
          }
          .animated-button:hover .button-text {
            transform: translateX(12px);
          }
          .animated-button:hover svg {
            fill: #0f0f0f;
          }
          .animated-button:active {
            scale: 0.95;
            box-shadow: 0 0 0 4px var(--button-color);
          }
          .animated-button:hover .button-circle {
            width: 220px;
            height: 220px;
            opacity: 1;
          }
        `}
        </style>

        <div data-overlay-container="true">
          <main>
            <div>
              <div className="absolute bottom-0 top-0 flex h-screen w-full flex-col">
                <div className="relative flex flex-col gap-20 text-white md:gap-10">
                  <div className="flex h-screen w-full items-center justify-center relative overflow-hidden">
                    <div
                      className="flex flex-col items-center gap-10"
                      id="main-content"
                    >
                      <div
                        className="w-full h-full pointer-events-none"
                        id="shader-gradient"
                      >
                        <ShaderGradientCanvas
                          style={{
                            position: "absolute",
                            top: 0,
                          }}
                        >
                          <ShaderGradient
                            control="query"
                            urlString="https://www.shadergradient.co/customize?animate=on&axesHelper=off&bgColor1=%23000000&bgColor2=%23000000&brightness=1.4&cAzimuthAngle=180&cDistance=2.8&cPolarAngle=80&cameraZoom=9.1&color1=%23606080&color2=%238d7dca&color3=%23212121&destination=onCanvas&embedMode=off&envPreset=city&format=gif&fov=45&frameRate=10&gizmoHelper=hide&grain=on&lightType=3d&pixelDensity=1&positionX=0&positionY=0&positionZ=0&range=disabled&rangeEnd=2.8&rangeStart=0&reflection=0&rotationX=50&rotationY=0&rotationZ=-60&shader=defaults&type=waterPlane&uAmplitude=0&uDensity=0.9&uFrequency=0&uSpeed=0.3&uStrength=1.5&uTime=8&wireframe=false"
                          />
                        </ShaderGradientCanvas>
                      </div>

                      <div className="flex items-center justify-between">
                        <h2
                          className="inline-block font-sourcehan text-center text-3xl lg:text-4xl md:text-3xl"
                          id="title"
                        >
                          欢迎使用
                          <span className="px-2 font-dela" id="now-playing-text">
                          Now Playing
                        </span>
                          服务
                        </h2>
                      </div>

                      <button
                        className="animated-button"
                        onClick={jumpToSettings}
                      >
                        <svg
                          className="arr-2"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
                        </svg>
                        <span className="button-text">前往设置</span>
                        <span className="button-circle" />
                        <svg
                          className="arr-1"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
                        </svg>
                      </button>
                    </div>

                    <div
                      style={{
                        position: "fixed",
                        bottom: "2.0rem",
                        width: "100%",
                        textAlign: "center",
                      }}
                    >
                      <div
                        className="font-poppins"
                        id="current-version-div"
                        style={{ marginBottom: "0.2rem" }}
                      >
                        版本号：{versionInfo.current}
                      </div>
                      <div className="font-poppins" id="update-text">
                        {versionInfo.isLatest ? (
                          "当前已是最新版本"
                        ) : versionInfo.latest ? (
                          <a
                            className="cursor-pointer"
                            onClick={() => {openExternalUrl("https://gitee.com/widdit/now-playing/releases");}}
                          >
                            检测到新版本可用：{versionInfo.latest}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 版本更新模态框 */}
            <Modal
              size="xl"
              isDismissable={false}
              scrollBehavior="inside"
              hideCloseButton={true}
              isOpen={isUpdateModalOpen}
              onOpenChange={onUpdateModalOpenChange}
              className="px-3 py-2"
            >
              <ModalContent className="font-poppins">
                {(onClose) => (
                  <>
                    <ModalHeader className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="breathing-bg flex h-9 w-9 items-center justify-center rounded-full bg-[#15283c]">
                          <Rocket size={20} strokeWidth={2} color="#0485f7" />
                        </div>
                        {versionInfo.latest} 新版本可用
                      </div>
                      <div className="font-normal text-sm text-default-500">
                        {timeSince(versionInfo.latestTimestamp)}
                      </div>
                    </ModalHeader>
                    <ModalBody>
                      <div className="markdown-body">
                        <ReactMarkdown
                          rehypePlugins={[rehypeRaw, rehypeHighlight]}
                          components={{
                            img: ({ node, ...props }) => (
                              <img
                                {...props}
                                referrerPolicy="no-referrer"
                                className="max-w-full h-auto rounded-lg my-2"
                              />
                            ),
                            a: ({ node, ...props }) => (
                              <a
                                {...props}
                                className="text-primary hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            ),
                          }}
                        >
                          {versionInfo.updateLog}
                        </ReactMarkdown>
                      </div>
                    </ModalBody>
                    <ModalFooter>
                      <Button color="default" variant="flat" onPress={onClose}>
                        取消
                      </Button>
                      <Button
                        color="primary"
                        onPress={() => {
                          onClose();
                          openExternalUrl("https://gitee.com/widdit/now-playing/releases");
                        }}
                      >
                        确定
                      </Button>
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>

            {/* 公告模态框 */}
            <Modal
              size="xl"
              isDismissable={false}
              isKeyboardDismissDisabled={true}
              scrollBehavior="inside"
              hideCloseButton={true}
              isOpen={isAnnouncementModalOpen}
              onOpenChange={onAnnouncementModalOpenChange}
              className="px-3 py-2"
            >
              <ModalContent className="font-poppins">
                {(onClose) => (
                  <>
                    <ModalHeader className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="breathing-bg flex h-9 w-9 items-center justify-center rounded-full bg-[#15283c]">
                          <Megaphone size={20} color="#0485f7" />
                        </div>
                        {announcementInfo.title}
                      </div>
                      <div className="font-normal text-sm text-default-500">
                        {timeSince(announcementInfo.timestamp)}
                      </div>
                    </ModalHeader>
                    <ModalBody>
                      <div className="markdown-body">
                        <ReactMarkdown
                          rehypePlugins={[rehypeRaw, rehypeHighlight]}
                          components={{
                            img: ({ node, ...props }) => (
                              <img
                                {...props}
                                referrerPolicy="no-referrer"
                                className="max-w-full h-auto rounded-lg my-2"
                              />
                            ),
                            a: ({ node, ...props }) => (
                              <a
                                {...props}
                                className="text-primary hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            ),
                          }}
                        >
                          {announcementInfo.content}
                        </ReactMarkdown>
                      </div>
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        color="primary"
                        onPress={() => {
                          onClose();
                          setAnnouncementClosed(true);
                        }}
                      >
                        确定
                      </Button>
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>
          </main>
        </div>
      </div>
    </>
  );
};
