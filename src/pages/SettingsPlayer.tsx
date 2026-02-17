import React from "react";
import { Image } from "@heroui/image";
import { Divider } from "@heroui/divider";
import { Accordion, AccordionItem } from "@heroui/accordion";
import {
  Palette,
  TabletSmartphone,
  Settings2,
  TvMinimalPlay,
  Maximize2
} from "lucide-react";
import { Link } from "@heroui/link";
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
import { IntegrationCard } from "@/components/IntegrationCard";

export default function PlayerSettingsPage() {
  const { openExternalUrl } = useOpenExternalUrl();

  const {
    isOpen: isOpenHelpModalOpen,
    onOpen: onOpenHelpModalOpen,
    onOpenChange: onOpenHelpModalOpenChange,
  } = useDisclosure();

  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-full max-w-[800px] py-6 px-10 gap-6">
        <h1 className="text-3xl text-white font-bold leading-9">播放器</h1>

        <div className="flex items-center justify-center w-full">
          <Alert
            description="为获得更佳的播放器视觉效果，推荐使用苹方字体"
            endContent={
              <Button
                size="sm"
                variant="flat"
                onPress={() => openExternalUrl("https://www.kdocs.cn/l/cuWdgy9CxwUU")}
              >
                查看教程
              </Button>
            }
            variant="faded"
          />
        </div>

        {/* 操作 */}
        <div className="flex flex-col gap-4">
          <h1 className="text-xl text-default-800 font-bold leading-9">
            操作
          </h1>

          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 p-0 h-10">
            <span className="text-foreground text-base">桌面播放器</span>
            <Button
              variant="ghost"
              onPress={onOpenHelpModalOpen}
            >
              打开
            </Button>
          </div>
        </div>

        <Divider />

        {/* 组件集成 */}
        <div className="flex flex-col gap-4">
          <h1 className="text-xl text-default-800 font-bold leading-9">
            组件集成
          </h1>
          <IntegrationCard
            path="/player"
            profileId="main"
          />
        </div>

        <Divider />

        {/* 使用帮助 */}
        <div className="flex flex-col gap-4 font-poppins">
          <h1 className="text-xl text-default-800 font-bold leading-9">
            使用帮助
          </h1>
          <Accordion variant="bordered">
            <AccordionItem
              classNames={{
                trigger: "cursor-pointer",
              }}
              startContent={
                <div className="w-6 h-6 flex items-center justify-center">
                  <Palette width={22} strokeWidth={1.5} />
                </div>
              }
              title="如何修改播放器中的歌词样式？"
            >
              <p className="leading-7">
                进入{" "}
                <a
                  className="custom-underline font-bold"
                  href="/settings/lyric"
                >
                  歌词组件
                </a>{" "}
                设置页面，将配置文件切换为 <b>"桌面播放器"</b>，即可对播放器歌词进行调整。
              </p>
            </AccordionItem>
            <AccordionItem
              classNames={{
                trigger: "cursor-pointer",
              }}
              startContent={
                <div className="w-6 h-6 flex items-center justify-center">
                  <Maximize2 width={22} strokeWidth={1.5} />
                </div>
              }
              title="桌面播放器如何全屏？"
            >
              <p className="leading-7">
                在播放器页面右键打开菜单，点击 "全屏" 选项即可进入全屏模式。
              </p>
            </AccordionItem>
            <AccordionItem
              classNames={{
                trigger: "cursor-pointer",
              }}
              startContent={
                <div className="w-6 h-6 flex items-center justify-center">
                  <TabletSmartphone width={22} strokeWidth={1.5} />
                </div>
              }
              title="能在手机/平板上打开播放器吗？怎样全屏显示？"
            >
              <p className="leading-8">
                完全可以！在上方组件集成中选择手机/平板，然后扫描二维码即可（无需下载 App）。
              </p>
              <p className="leading-8">
                如需了解移动设备的全屏显示方法，可参考{" "}
                <Link
                  className="cursor-pointer"
                  showAnchorIcon
                  onPress={() => {openExternalUrl("https://www.kdocs.cn/l/cnSwI0FAxaOD");}}
                >
                  文档
                </Link>
                。
              </p>
            </AccordionItem>
            <AccordionItem
              classNames={{
                trigger: "cursor-pointer",
              }}
              startContent={
                <div className="w-6 h-6 flex items-center justify-center">
                  <TvMinimalPlay width={22} strokeWidth={1.5} />
                </div>
              }
              title="如何在手机/平板上横屏显示播放器？"
            >
              <p className="leading-7">
                先将设备的 <b>"竖屏锁定"</b> 功能关闭，再旋转屏幕，播放器会根据屏幕方向自动适配布局。
              </p>
            </AccordionItem>
            <AccordionItem
              classNames={{
                trigger: "cursor-pointer",
              }}
              startContent={
                <div className="w-6 h-6 flex items-center justify-center">
                  <Settings2 width={22} strokeWidth={1.5} />
                </div>
              }
              title="播放器的样式支持修改吗？"
            >
              <p className="leading-7">
                播放器的样式调整功能正在开发中，将在后续版本中上线。
              </p>
            </AccordionItem>
          </Accordion>
        </div>

        <Spacer y={2} />

        {/* 打开播放器帮助模态框 */}
        <Modal
          isOpen={isOpenHelpModalOpen}
          onOpenChange={onOpenHelpModalOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">提示</ModalHeader>
                <ModalBody>
                  <p className="leading-7">
                    您可以右键单击托盘图标，在菜单中直接打开播放器。
                  </p>
                  <Image
                    alt="打开播放器帮助"
                    src="/assets/player-open-help.png"
                    width={256}
                  />
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

                      // 向桌面端发送请求
                      try {
                        const url = new URL("http://localhost:9864/player/show");

                        await fetch(url.toString(), {
                          method: "GET",
                          mode: "no-cors", // 避免 CORS 问题，但无法获取响应
                        });
                      } catch (error: any) {
                        console.error("向桌面端发送请求失败:", error);
                        addToast({
                          title: "向桌面端发送请求失败",
                          description: error?.message,
                          color: "danger",
                          timeout: 6000,
                        });
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
