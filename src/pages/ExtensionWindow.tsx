import React, { useEffect, useState, useRef } from "react";
import { Alert } from "@heroui/alert";
import { Switch } from "@heroui/switch";
import { NumberInput } from "@heroui/number-input";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { addToast } from "@heroui/toast";
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

interface OsBitResponse {
  osBit: number;
}

export default function WindowExtensionPage() {
  // 歌曲组件状态
  const [songEnabled, setSongEnabled] = useState<boolean>();
  const [songWidth, setSongWidth] = useState<number>();
  const [songHeight, setSongHeight] = useState<number>();
  const [songWidthInvalid, setSongWidthInvalid] = useState(false);
  const [songHeightInvalid, setSongHeightInvalid] = useState(false);

  // 歌词组件状态
  const [lyricEnabled, setLyricEnabled] = useState<boolean>();
  const [lyricWidth, setLyricWidth] = useState<number>();
  const [lyricHeight, setLyricHeight] = useState<number>();
  const [lyricWidthInvalid, setLyricWidthInvalid] = useState(false);
  const [lyricHeightInvalid, setLyricHeightInvalid] = useState(false);

  // 自定义组件数据（不显示在页面上，但需要传给后端）
  const [customData, setCustomData] = useState({
    enabled: false,
    width: 800,
    height: 600,
  });

  // 防抖定时器引用
  const debounceRefs = {
    songWidth: useRef<NodeJS.Timeout | null>(null),
    songHeight: useRef<NodeJS.Timeout | null>(null),
    lyricWidth: useRef<NodeJS.Timeout | null>(null),
    lyricHeight: useRef<NodeJS.Timeout | null>(null),
  };

  const {
    isOpen: is32BitModalOpen,
    onOpen: on32BitModalOpen,
    onOpenChange: on32BitModalOpenChange,
  } = useDisclosure();

  const { openExternalUrl } = useOpenExternalUrl();

  // 页面加载时获取设置
  useEffect(() => {
    fetch("/api/settings/plugin/windowWidget")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP 响应错误！状态码：${res.status}`);
        }

        return res.json();
      })
      .then((data) => {
        if (data.songWindow) {
          setSongEnabled(data.songWindow.enabled ?? false);
          setSongWidth(data.songWindow.width ?? 800);
          setSongHeight(data.songWindow.height ?? 600);
        }
        if (data.lyricWindow) {
          setLyricEnabled(data.lyricWindow.enabled ?? false);
          setLyricWidth(data.lyricWindow.width ?? 800);
          setLyricHeight(data.lyricWindow.height ?? 600);
        }
        if (data.customWindow) {
          setCustomData({
            enabled: data.customWindow.enabled ?? false,
            width: data.customWindow.width ?? 800,
            height: data.customWindow.height ?? 600,
          });
        }
      })
      .catch((err) => {
        console.error("加载设置失败", err);
        addToast({
          title: "加载设置失败",
          description: err.message,
          color: "danger",
          timeout: 6000,
        });
      });
  }, []);

  // 保存设置
  const saveSettings = (
    newSong?: { enabled?: boolean; width?: number; height?: number },
    newLyric?: { enabled?: boolean; width?: number; height?: number },
  ) => {
    const payload = {
      songWindow: {
        enabled: newSong?.enabled ?? songEnabled,
        width: newSong?.width ?? songWidth,
        height: newSong?.height ?? songHeight,
      },
      lyricWindow: {
        enabled: newLyric?.enabled ?? lyricEnabled,
        width: newLyric?.width ?? lyricWidth,
        height: newLyric?.height ?? lyricHeight,
      },
      customWindow: customData, // 不显示但仍提交
    };

    fetch("/api/settings/plugin/windowWidget", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.ok) {
          console.log("保存设置成功");
          addToast({
            title: "保存成功",
            description: "已成功修改设置",
            timeout: 2000,
          });
        } else {
          throw new Error(`HTTP 响应错误！状态码：${response.status}`);
        }
      })
      .catch((err) => {
        console.error("保存设置失败", err);
        addToast({
          title: "保存失败",
          description: err.message,
          color: "danger",
          timeout: 6000,
        });
      });
  };

  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-full max-w-[800px] py-6 px-10 gap-6">
        <h1 className="text-3xl text-white font-bold leading-9">窗口模式</h1>

        <div className="flex items-center justify-center w-full">
          <Alert
            description="窗口模式仅适用于直播伴侣和直播姬，用于解决虚拟摄像头部分情况下卡顿的问题"
            endContent={
              <Button
                size="sm"
                variant="flat"
                onPress={() => {
                  openExternalUrl("https://www.kdocs.cn/l/cpEGQWnJGcJL");
                }}
              >
                查看教程
              </Button>
            }
            variant="faded"
          />
        </div>

        {/* 歌曲组件 */}
        <div className="flex flex-col gap-4">
          <h1 className="text-xl text-default-800 font-bold leading-9">
            歌曲组件
          </h1>

          {/* 启用窗口 */}
          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 p-0 h-10">
            <span className="relative text-foreground select-none text-base">
              启用窗口
            </span>
            <Switch
              isSelected={songEnabled}
              onValueChange={async (isSelected) => {
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

                setSongEnabled(isSelected);
                saveSettings({ enabled: isSelected });
              }}
            />
          </div>

          {/* 宽度 */}
          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 p-0">
            <span className="relative text-foreground select-none text-base">
              宽度
            </span>
            <div>
              <NumberInput
                className="w-32 font-poppins"
                endContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">px</span>
                  </div>
                }
                errorMessage="请输入有效宽度"
                isInvalid={songWidthInvalid}
                labelPlacement="outside-left"
                maxValue={2560}
                minValue={100}
                step={1}
                value={songWidth}
                onValueChange={(val) => {
                  const isValid = typeof val === "number" && !isNaN(val);

                  setSongWidthInvalid(!isValid);
                  setSongWidth(val as number);

                  if (debounceRefs.songWidth.current)
                    clearTimeout(debounceRefs.songWidth.current);
                  if (isValid) {
                    debounceRefs.songWidth.current = setTimeout(() => {
                      saveSettings({ width: val as number });
                    }, 1500);
                  }
                }}
              />
            </div>
          </div>

          {/* 高度 */}
          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 p-0">
            <span className="relative text-foreground select-none text-base">
              高度
            </span>
            <div>
              <NumberInput
                className="w-32 font-poppins"
                endContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">px</span>
                  </div>
                }
                errorMessage="请输入有效高度"
                isInvalid={songHeightInvalid}
                labelPlacement="outside-left"
                maxValue={2560}
                minValue={100}
                step={1}
                value={songHeight}
                onValueChange={(val) => {
                  const isValid = typeof val === "number" && !isNaN(val);

                  setSongHeightInvalid(!isValid);
                  setSongHeight(val as number);

                  if (debounceRefs.songHeight.current)
                    clearTimeout(debounceRefs.songHeight.current);
                  if (isValid) {
                    debounceRefs.songHeight.current = setTimeout(() => {
                      saveSettings({ height: val as number });
                    }, 1500);
                  }
                }}
              />
            </div>
          </div>
        </div>

        <Divider />

        {/* 歌词组件 */}
        <div className="flex flex-col gap-4">
          <h1 className="text-xl text-default-800 font-bold leading-9">
            歌词组件
          </h1>

          {/* 启用窗口 */}
          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 p-0 h-10">
            <span className="relative text-foreground select-none text-base">
              启用窗口
            </span>
            <Switch
              isSelected={lyricEnabled}
              onValueChange={async (isSelected) => {
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

                setLyricEnabled(isSelected);
                saveSettings(undefined, { enabled: isSelected });
              }}
            />
          </div>

          {/* 宽度 */}
          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 p-0">
            <span className="relative text-foreground select-none text-base">
              宽度
            </span>
            <div>
              <NumberInput
                className="w-32 font-poppins"
                endContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">px</span>
                  </div>
                }
                errorMessage="请输入有效宽度"
                isInvalid={lyricWidthInvalid}
                labelPlacement="outside-left"
                maxValue={2560}
                minValue={100}
                step={1}
                value={lyricWidth}
                onValueChange={(val) => {
                  const isValid = typeof val === "number" && !isNaN(val);

                  setLyricWidthInvalid(!isValid);
                  setLyricWidth(val as number);

                  if (debounceRefs.lyricWidth.current)
                    clearTimeout(debounceRefs.lyricWidth.current);
                  if (isValid) {
                    debounceRefs.lyricWidth.current = setTimeout(() => {
                      saveSettings(undefined, { width: val as number });
                    }, 1500);
                  }
                }}
              />
            </div>
          </div>

          {/* 高度 */}
          <div className="group relative inline-flex flex-row w-full max-w-full items-center justify-between gap-2 p-0">
            <span className="relative text-foreground select-none text-base">
              高度
            </span>
            <div>
              <NumberInput
                className="w-32 font-poppins"
                endContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">px</span>
                  </div>
                }
                errorMessage="请输入有效高度"
                isInvalid={lyricHeightInvalid}
                labelPlacement="outside-left"
                maxValue={2560}
                minValue={100}
                step={1}
                value={lyricHeight}
                onValueChange={(val) => {
                  const isValid = typeof val === "number" && !isNaN(val);

                  setLyricHeightInvalid(!isValid);
                  setLyricHeight(val as number);

                  if (debounceRefs.lyricHeight.current)
                    clearTimeout(debounceRefs.lyricHeight.current);
                  if (isValid) {
                    debounceRefs.lyricHeight.current = setTimeout(() => {
                      saveSettings(undefined, { height: val as number });
                    }, 1500);
                  }
                }}
              />
            </div>
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
                    抱歉，窗口模式不支持 32 位 Windows 系统，请使用其它方式。
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
      </div>
    </div>
  );
}
