import type { Key } from "@react-types/shared";

import React, { useEffect, useState, useRef } from "react";
import { Alert } from "@heroui/alert";
import { Switch } from "@heroui/switch";
import { NumberInput } from "@heroui/number-input";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { addToast, closeAll } from "@heroui/toast";
import { Select, SelectItem } from "@heroui/select";
import { RadioGroup, Radio } from "@heroui/radio";
import { useDisclosure } from "@heroui/use-disclosure";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Spacer } from "@heroui/spacer";
import { useOpenExternalUrl } from "@/hooks/useOpenExternalUrl";

type Settings = {
  enabled: boolean;
  installed: boolean;
  content: string;
  resolution: string;
  width: number;
  height: number;
  fps: number;
};

interface OsBitResponse {
  osBit: number;
}

export default function CameraSettingsPage() {
  const [enabled, setEnabled] = useState<boolean>();
  const [installed, setInstalled] = useState<boolean>(false);
  const [content, setContent] = useState<Set<Key>>();
  const [resolution, setResolution] = useState<Set<Key>>();
  const [width, setWidth] = useState<number>();
  const [height, setHeight] = useState<number>();
  const [fps, setFps] = useState<string>();

  const [isWidthInvalid, setIsWidthInvalid] = useState(false);
  const [isHeightInvalid, setIsHeightInvalid] = useState(false);

  const [initialized, setInitialized] = useState(false);

  const widthDebounce = useRef<NodeJS.Timeout | null>(null);
  const heightDebounce = useRef<NodeJS.Timeout | null>(null);

  const {
    isOpen: is32BitModalOpen,
    onOpen: on32BitModalOpen,
    onOpenChange: on32BitModalOpenChange,
  } = useDisclosure();

  const {
    isOpen: isInstallModalOpen,
    onOpen: onInstallModalOpen,
    onOpenChange: onInstallModalOpenChange,
  } = useDisclosure();

  const { openExternalUrl } = useOpenExternalUrl();

  // ---- 保存设置函数 ----
  const saveSettings = async (newSettings: Partial<Settings>) => {
    try {
      const body: Settings = {
        enabled: enabled ?? false,
        installed,
        content: content ? (Array.from(content)[0] as string) : "song",
        resolution: resolution ? (Array.from(resolution)[0] as string) : "720p",
        width: width ?? 1280,
        height: height ?? 720,
        fps: fps ? parseInt(fps, 10) : 60,
        ...newSettings,
      };

      const resp = await fetch("/api/settings/plugin/virtualCamera", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (resp.ok) {
        console.log("保存设置成功");
        addToast({
          title: "保存成功",
          description: "已成功修改设置",
          timeout: 2000,
        });
      } else {
        throw new Error(`HTTP 响应错误！状态码：${resp.status}`);
      }
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

  // ---- 首次加载时回显 ----
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch("/api/settings/plugin/virtualCamera");

        if (!resp.ok) throw new Error(`HTTP 响应错误！状态码：${resp.status}`);
        const data: Settings = await resp.json();

        setEnabled(data.enabled);
        setInstalled(data.installed);
        setContent(new Set([data.content]));
        setResolution(new Set([data.resolution]));
        setWidth(data.width);
        setHeight(data.height);
        setFps(data.fps.toString());
      } catch (err: any) {
        console.error("加载设置失败", err);
        addToast({
          title: "加载设置失败",
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

  // ---- 处理分辨率联动宽高 ----
  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!resolution) {
      return;
    }

    const selected = Array.from(resolution)[0];

    if (selected === "1080p") {
      setWidth(1920);
      setHeight(1080);
      saveSettings({ resolution: "1080p", width: 1920, height: 1080 });
    } else if (selected === "720p") {
      setWidth(1280);
      setHeight(720);
      saveSettings({ resolution: "720p", width: 1280, height: 720 });
    } else if (selected === "custom") {
      saveSettings({ resolution: "custom" });
    }
  }, [resolution]);

  // ---- 展示保存未生效的警告 ----
  const showUnsavedWarning = () => {
    addToast({
      title: "保存未生效",
      description: "您需要先关闭虚拟摄像头才能更改设置",
      color: "warning",
      timeout: 6000,
      endContent: (
        <Button
          color="warning"
          size="sm"
          variant="solid"
          onPress={() => {
            setEnabled(false);
            closeAll();
            saveSettings({ enabled: false });
          }}
        >
          关闭
        </Button>
      ),
    });
  };

  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-full max-w-[800px] py-6 px-10 gap-6">
        <h1 className="text-3xl text-white font-bold leading-9">虚拟摄像头</h1>

        <div className="flex items-center justify-center w-full">
          <Alert
            description="该模式适用于不支持浏览器源的直播软件，若支持则无需使用"
            endContent={
              <Button
                size="sm"
                variant="flat"
                onPress={() => {
                  openExternalUrl("https://www.kdocs.cn/l/ctx17GMym7dP");
                }}
              >
                查看教程
              </Button>
            }
            variant="faded"
          />
        </div>

        {/* 基础设置 */}
        <div className="flex flex-col gap-4">
          <h1 className="text-xl text-default-800 font-bold leading-9">
            基础设置
          </h1>

          {/* 启用虚拟摄像头 */}
          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 p-0 h-10">
            <span className="text-foreground text-base">启用虚拟摄像头</span>
            <Switch
              isSelected={enabled}
              onValueChange={async (val) => {
                // 检测系统是否为 32 位
                try {
                  const response = await fetch("/api/system/osBit");

                  if (!response.ok) {
                    throw new Error(
                      `HTTP 响应错误！状态码：${response.status}`,
                    );
                  }

                  const data: OsBitResponse = await response.json();
                  const { osBit } = data;

                  if (osBit === 32) {
                    on32BitModalOpen();

                    return;
                  }
                } catch (error: any) {
                  addToast({
                    title: "获取系统信息失败",
                    description: error.message,
                    color: "danger",
                    timeout: 6000,
                  });

                  return;
                }

                // 检测虚拟摄像头文件是否已放置在指定目录
                try {
                  const response = await fetch(
                    "/api/settings/plugin/hasVirtualCamera",
                  );

                  if (!response.ok) {
                    throw new Error(
                      `HTTP 响应错误！状态码：${response.status}`,
                    );
                  }

                  const responseText = await response.text();

                  if (!responseText.includes("yes")) {
                    onInstallModalOpen();

                    return;
                  }
                } catch (error: any) {
                  addToast({
                    title: "获取磁盘文件状态失败",
                    description: error.message,
                    color: "danger",
                    timeout: 6000,
                  });

                  return;
                }

                setEnabled(val);
                saveSettings({ enabled: val });
              }}
            />
          </div>

          {/* 显示内容 */}
          <div className="group relative flex flex-col w-full max-w-full gap-2">
            <span className="text-primary-900 text-xs font-bold cursor-default user-select-none">
              显示内容
            </span>
            <Select
              className="w-full font-poppins"
              classNames={{
                trigger: "cursor-pointer transition-background !duration-150",
                innerWrapper: "pl-1",
              }}
              selectedKeys={content}
              size="lg"
              onSelectionChange={(keys) => {
                if (enabled) {
                  showUnsavedWarning();

                  return;
                }

                if (keys instanceof Set && keys.size > 0) {
                  setContent(keys);
                  saveSettings({ content: Array.from(keys)[0] as string });
                }
              }}
            >
              <SelectItem
                key="song"
                className="h-11 mb-1 last:mb-0"
                classNames={{
                  base: "px-4",
                  title: "text-base font-poppins",
                }}
              >
                歌曲组件
              </SelectItem>
              <SelectItem
                key="lyric"
                className="h-11 mb-1 last:mb-0"
                classNames={{
                  base: "px-4",
                  title: "text-base font-poppins",
                }}
              >
                歌词组件
              </SelectItem>
            </Select>
          </div>
        </div>

        <Divider />

        {/* 输出设置 */}
        <div className="flex flex-col gap-4">
          <h1 className="text-xl text-default-800 font-bold leading-9">
            输出设置
          </h1>

          {/* 分辨率 */}
          <div className="group relative flex flex-col w-full max-w-full gap-2">
            <span className="text-primary-900 text-xs font-bold cursor-default user-select-none">
              分辨率
            </span>
            <Select
              className="w-full font-poppins"
              classNames={{
                trigger: "cursor-pointer transition-background !duration-150",
                innerWrapper: "pl-1",
              }}
              selectedKeys={resolution}
              size="lg"
              onSelectionChange={(keys) => {
                if (enabled) {
                  showUnsavedWarning();

                  return;
                }

                if (keys instanceof Set && keys.size > 0) {
                  setResolution(keys);
                }
              }}
            >
              <SelectItem
                key="1080p"
                className="h-11 mb-1 last:mb-0"
                classNames={{
                  base: "px-4",
                  title: "text-base font-poppins",
                }}
              >
                1920 × 1080
              </SelectItem>
              <SelectItem
                key="720p"
                className="h-11 mb-1 last:mb-0"
                classNames={{
                  base: "px-4",
                  title: "text-base font-poppins",
                }}
              >
                1280 × 720
              </SelectItem>
              <SelectItem
                key="custom"
                className="h-11 mb-1 last:mb-0"
                classNames={{
                  base: "px-4",
                  title: "text-base font-poppins",
                }}
              >
                自定义
              </SelectItem>
            </Select>
          </div>

          {/* 宽度 */}
          <div className="group relative inline-flex flex-row w-full items-center justify-between gap-2">
            <span
              className={`text-foreground text-base ${(resolution && resolution.size > 0 ? Array.from(resolution)[0] !== "custom" : true) && "opacity-40 pointer-events-none select-none"}`}
            >
              宽度
            </span>
            <NumberInput
              className="w-32 font-poppins"
              endContent={
                <div className="pointer-events-none flex items-center">
                  <span className="text-default-400 text-small">px</span>
                </div>
              }
              errorMessage="请输入有效宽度"
              isDisabled={
                resolution && resolution.size > 0
                  ? Array.from(resolution)[0] !== "custom"
                  : true
              }
              isInvalid={isWidthInvalid}
              labelPlacement="outside-left"
              maxValue={2560}
              minValue={100}
              step={1}
              value={width}
              onValueChange={(val) => {
                if (enabled) {
                  showUnsavedWarning();

                  return;
                }

                const isValid = typeof val === "number" && !isNaN(val);

                setIsWidthInvalid(!isValid);
                setWidth(val);

                if (widthDebounce.current) clearTimeout(widthDebounce.current);
                if (isValid) {
                  widthDebounce.current = setTimeout(() => {
                    saveSettings({ width: val });
                  }, 1500);
                }
              }}
            />
          </div>

          {/* 高度 */}
          <div className="group relative inline-flex flex-row w-full items-center justify-between gap-2">
            <span
              className={`text-foreground text-base ${(resolution && resolution.size > 0 ? Array.from(resolution)[0] !== "custom" : true) && "opacity-40 pointer-events-none select-none"}`}
            >
              高度
            </span>
            <NumberInput
              className="w-32 font-poppins"
              endContent={
                <div className="pointer-events-none flex items-center">
                  <span className="text-default-400 text-small">px</span>
                </div>
              }
              errorMessage="请输入有效高度"
              isDisabled={
                resolution && resolution.size > 0
                  ? Array.from(resolution)[0] !== "custom"
                  : true
              }
              isInvalid={isHeightInvalid}
              labelPlacement="outside-left"
              maxValue={2560}
              minValue={100}
              step={1}
              value={height}
              onValueChange={(val) => {
                if (enabled) {
                  showUnsavedWarning();

                  return;
                }

                const isValid = typeof val === "number" && !isNaN(val);

                setIsHeightInvalid(!isValid);
                setHeight(val);

                if (heightDebounce.current)
                  clearTimeout(heightDebounce.current);
                if (isValid) {
                  heightDebounce.current = setTimeout(() => {
                    saveSettings({ height: val });
                  }, 1500);
                }
              }}
            />
          </div>

          {/* 帧率 */}
          <div className="group relative inline-flex flex-row w-full items-center justify-between gap-2 h-10">
            <span className="text-foreground text-base">帧率</span>
            <RadioGroup
              classNames={{ wrapper: "gap-6" }}
              orientation="horizontal"
              value={fps}
              onValueChange={(val) => {
                if (enabled) {
                  showUnsavedWarning();

                  return;
                }

                setFps(val);
                saveSettings({ fps: parseInt(val, 10) });
              }}
            >
              <Radio className="font-poppins" value="30">
                30 FPS
              </Radio>
              <Radio className="font-poppins" value="60">
                60 FPS
              </Radio>
            </RadioGroup>
          </div>
        </div>

        <Spacer y={2} />

        {/* 32 位系统模态框 */}
        <Modal isOpen={is32BitModalOpen} onOpenChange={on32BitModalOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">提示</ModalHeader>
                <ModalBody>
                  <p className="leading-7">
                    抱歉，虚拟摄像头不支持 32 位 Windows 系统，请使用其它方式。
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

        {/* 未放置虚拟摄像头文件模态框 */}
        <Modal
          isOpen={isInstallModalOpen}
          onOpenChange={onInstallModalOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">提示</ModalHeader>
                <ModalBody>
                  <p className="leading-7">
                    您尚未将虚拟摄像头文件放置于指定目录，请按照文档进行操作。
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button
                    color="primary"
                    onPress={() => {
                      onClose();
                      openExternalUrl("https://www.kdocs.cn/l/ctx17GMym7dP");
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
