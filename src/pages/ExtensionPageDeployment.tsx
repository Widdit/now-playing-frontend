import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Divider } from "@heroui/divider";
import { Spacer } from "@heroui/spacer";
import { useOpenExternalUrl } from "@/hooks/useOpenExternalUrl";
import { Alert } from "@heroui/alert";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { useDisclosure } from "@heroui/use-disclosure";
import { addToast } from "@heroui/toast";
import { Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader } from "@heroui/drawer";
import { Code } from "@heroui/code";
import { Input } from "@heroui/input";
import CopyButton from "@/components/CopyButton";
import { Send } from "@/components/animate-icons/Send";
import SimulatedBrowserWindow from "@/components/SimulatedBrowserWindow";

type LayoutOutletContext = {
  scrollToBottom: (behavior?: ScrollBehavior) => void;
};

export default function PageDeploymentExtensionPage() {
  const { openExternalUrl } = useOpenExternalUrl();

  const outletContext = useOutletContext<LayoutOutletContext | undefined>();
  const scrollToBottom = outletContext?.scrollToBottom;

  const [publicPath, setPublicPath] = useState("");
  const [isSendHovered, setIsSendHovered] = useState<boolean>(false);
  const [url, setUrl] = useState("http://localhost:9863/public/example/index.html");
  const [iframeSrc, setIframeSrc] = useState("http://localhost:9863/public/example/index.html");
  const [iframeKey, setIframeKey] = useState(0);

  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onOpenChange: onDrawerOpenChange,
  } = useDisclosure();

  const {
    isOpen: isRestoreExampleModalOpen,
    onOpen: onRestoreExampleModalOpen,
    onOpenChange: onRestoreExampleModalOpenChange,
  } = useDisclosure();

  // 获取软件公共目录
  useEffect(() => {
    fetch("/api/system/installPath")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP 响应错误！状态码：${res.status}`);
        }

        return res.json();
      })
      .then((resObj) => {
        setPublicPath(resObj.data + "\\Public");
      })
      .catch((err) => {
        console.error("获取软件公共目录失败", err);
        addToast({
          title: "获取软件公共目录失败",
          description: err.message,
          color: "danger",
          timeout: 6000,
        });
      });
  }, []);

  /**
   * 校验字符串是否以 .html 或 .htm 结尾，
   * 同时支持结尾带查询参数的情况（例如：xxx.html?id=1&name=Mike）。
   *
   * 匹配规则：
   * 1. 必须以 .html 或 .htm 结尾
   * 2. 允许后面带有查询参数
   * 3. 不区分大小写（支持 .HTML / .HTM）
   */
  const validateHtml = (value: string): boolean => {
    return /\.html?(?:\?.*)?$/i.test(value);
  };

  const isUrlInvalid = useMemo(() => {
    if (url === "") return false;

    return !validateHtml(url);
  }, [url]);

  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-full max-w-[800px] py-6 px-10 gap-6">
        <h1 className="text-3xl text-white font-bold leading-9">页面部署</h1>

        <div className="flex items-center justify-center w-full">
          <Alert
            className="font-poppins"
            description="支持开发者基于 API 自定义前端页面，并通过内置服务器实现本地部署"
            endContent={
              <Button
                size="sm"
                variant="flat"
                onPress={onDrawerOpen}
              >
                查看教程
              </Button>
            }
            variant="faded"
          />
        </div>

        {/* 操作 */}
        <div className="flex flex-col gap-4 font-poppins">
          <h1 className="text-xl text-default-800 font-bold leading-9">
            操作
          </h1>

          {/* 软件公共目录 */}
          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 h-16">
            <div className="flex flex-col gap-[2px]">
              <span>软件公共目录</span>
              <span className="text-color-desc text-sm min-h-[1.25rem]">
                {publicPath || ""}
              </span>
            </div>
            <Button
              variant="ghost"
              onPress={async () => {
                try {
                  await fetch("/api/system/openPublicDir");
                } catch (err) {
                  console.error("打开软件公共目录失败", err);
                }
              }}
            >
              打开
            </Button>
          </div>

          {/* 示例页面 */}
          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 h-16">
            <div className="flex flex-col gap-[2px]">
              <span>示例页面</span>
              <span className="text-color-desc text-sm">
                仿 iOS 风格的歌曲组件
              </span>
            </div>
            <Button
              variant="ghost"
              onPress={() => {openExternalUrl("http://localhost:9863/public/example/index.html");}}
            >
              查看
            </Button>
          </div>

          {/* 还原示例页面 */}
          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 h-16">
            <div className="flex flex-col gap-[2px]">
              <span>还原示例页面</span>
              <span className="text-color-desc text-sm">
                将示例页面恢复为官方初始版本
              </span>
            </div>
            <Button
              variant="ghost"
              onPress={onRestoreExampleModalOpen}
            >
              还原
            </Button>
          </div>
        </div>

        <Divider />

        {/* 预览 */}
        <div className="flex flex-col gap-4 font-poppins">
          <h1 className="text-xl text-default-800 font-bold leading-9">
            预览
          </h1>

          <div className="flex gap-2">
            <Input
              classNames={{
                inputWrapper: "pl-4 pr-0 font-jetbrains",
              }}
              color={isUrlInvalid ? "danger" : "default"}
              errorMessage="预览窗口 URL 必须以 .html 或 .htm 结尾！（可带有查询参数）"
              isInvalid={isUrlInvalid}
              endContent={
                <CopyButton copyContent={url} variant="light" />
              }
              type="text"
              variant="bordered"
              value={url}
              onValueChange={setUrl}
            />

            <Button
              className="px-5"
              color={isUrlInvalid ? "default" : "primary"}
              startContent={
                <Send
                  className="p-0"
                  isHovered={isSendHovered}
                  size={14}
                  trigger="none"
                />
              }
              isDisabled={isUrlInvalid}
              onMouseEnter={() => setIsSendHovered(true)}
              onMouseLeave={() => setIsSendHovered(false)}
              onPress={() => {
                setIframeSrc(url);
                setIframeKey((prev) => prev + 1);
              }}
            >
              访问
            </Button>
          </div>

          {/* 模拟浏览器窗口 */}
          <SimulatedBrowserWindow
            iframeKey={iframeKey}
            iframeSrc={iframeSrc}
            onOpenExternal={() => {openExternalUrl(iframeSrc);}}
            onReload={() => setIframeKey((prev) => prev + 1)}
            autoScrollToBottom={true}
            onResizing={() => {
              scrollToBottom?.("auto");
            }}
          />
        </div>

        <Spacer y={2} />

        {/* 使用说明 */}
        <Drawer
          isOpen={isDrawerOpen}
          size="lg"
          onOpenChange={onDrawerOpenChange}
        >
          <DrawerContent>
            {(onClose) => (
              <>
                <DrawerHeader className="flex flex-col gap-1">
                  <h1 className="text-2xl text-default-800 font-bold leading-12">
                    使用说明
                  </h1>
                </DrawerHeader>
                <DrawerBody>
                  <ul className="list-disc flex flex-col gap-2 ml-4">
                    <li className="ps-1 leading-8">
                      打开{" "}
                      <span
                        className="custom-underline font-bold"
                        onClick={async () => {
                          try {
                            await fetch("/api/system/openInstallPath");
                          } catch (err) {
                            console.error("打开软件安装目录失败", err);
                          }
                        }}
                      >
                        软件安装目录
                      </span>{" "}
                      的 <Code className="font-jetbrains">Public</Code>{" "}
                      文件夹；
                    </li>
                    <li className="ps-1 leading-8">
                      将您编写的前端页面（如{" "}
                      <Code className="font-jetbrains">.html</Code>
                      ）及相关静态资源文件（如{" "}
                      <Code className="font-jetbrains">.css</Code>、
                      <Code className="font-jetbrains">.js</Code>、
                      图片等）放置到{" "}
                      <Code className="font-jetbrains">Public</Code> 目录下；
                    </li>
                    <li className="ps-1 leading-8 font-poppins">
                      可通过{" "}
                      <Code className="font-jetbrains">http://localhost:9863/public/路径/文件名</Code>{" "}
                      的方式访问页面，URL 路径结构与{" "}
                      <Code className="font-jetbrains">Public</Code>{" "}
                      目录中的实际文件层级保持一致。
                    </li>
                  </ul>

                  <Spacer y={2} />
                  <h2 className="text-lg text-default-800 font-bold leading-6">
                    提示
                  </h2>

                  <ul className="list-disc flex flex-col gap-2 ml-4">
                    <li className="ps-1 leading-8 font-poppins">
                      本功能基于软件内置本地服务器运行，支持热部署，无需额外配置 Web 服务环境；
                    </li>
                    <li className="ps-1 leading-8 font-poppins">
                      页面可通过{" "}
                      <a
                        href="/apiPage"
                        className="cursor-pointer custom-underline font-bold font-poppins"
                      >
                        Now Playing API
                      </a>{" "}
                      获取实时数据；
                    </li>
                    <li className="ps-1 leading-8 font-poppins">
                      您可以根据需要自行创建子目录进行分类管理。
                    </li>
                  </ul>
                </DrawerBody>
                <DrawerFooter>
                  <Button color="default" variant="flat" onPress={onClose}>
                    关闭
                  </Button>
                </DrawerFooter>
              </>
            )}
          </DrawerContent>
        </Drawer>

        {/* 还原示例页面模态框 */}
        <Modal
          isOpen={isRestoreExampleModalOpen}
          onOpenChange={onRestoreExampleModalOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">提示</ModalHeader>
                <ModalBody>
                  <p className="leading-7">
                    您确定要还原示例页面吗？
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button
                    color="default"
                    variant="flat"
                    onPress={onClose}
                  >
                    取消
                  </Button>
                  <Button
                    color="primary"
                    onPress={async () => {
                      onClose();

                      try {
                        await fetch("/api/system/restorePublicExample");

                        addToast({
                          color: "success",
                          title: "还原成功",
                          description: "已将示例页面恢复为初始版本",
                          timeout: 3000,
                        });
                      } catch (err) {
                        console.error("还原示例页面失败", err);
                      }
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
