// IntegrationCard.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Alert } from "@heroui/alert";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Radio, RadioGroup } from "@heroui/radio";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { Monitor, Smartphone, Tablet, MonitorSmartphone } from "lucide-react";
import CopyButton from "@/components/CopyButton";
import StyledQRCode from "@/components/StyledQRCode";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { useDisclosure } from "@heroui/use-disclosure";

interface IntegrationCardProps {
  path: string;
  profileId: string;
}

interface PcTabProps {
  url: string;
}

interface MobileTabProps {
  url: string;
  deviceName: string;
  onModalOpen: () => void;
}

interface DeviceCardProps {
  name: string;
  ip: string;
  online: boolean;
}

interface NetworkInterface {
  name: string;
  ipAddress: string;
}

const cn = (...classNames: (string | undefined | null | false)[]) => {
  return classNames.filter(Boolean).join(" ");
};

const PcTab: React.FC<PcTabProps> = ({ url }) => (
  <div className="flex flex-col gap-2">
    <span className="text-primary-900 text-xs font-bold">组件 URL</span>
    <Input
      className="font-jetbrains"
      classNames={{
        inputWrapper: "pl-4 pr-0",
      }}
      isReadOnly
      endContent={<CopyButton copyContent={url} variant="light" />}
      type="text"
      value={url}
      variant="bordered"
    />
    <div className="w-full mt-5 text-sm text-color-desc flex items-center justify-center">
      将上方内容填写到直播软件的浏览器源 URL 栏
    </div>
  </div>
);

const MobileTab: React.FC<MobileTabProps> = ({ url, deviceName, onModalOpen }) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-primary-900 text-xs font-bold">组件 URL</span>
      <Input
        className="font-jetbrains"
        classNames={{
          inputWrapper: "pl-4 pr-0",
        }}
        isReadOnly
        endContent={<CopyButton copyContent={url} variant="light" />}
        type="text"
        value={url}
        variant="bordered"
      />
      <Alert
        className="mt-4"
        classNames={{
          base: "bg-[#1e1e22]!",
        }}
        description={`请确保${deviceName}与电脑在同一局域网`}
        variant="flat"
        endContent={
          <Button
            size="sm"
            variant="flat"
            onPress={onModalOpen}
          >
            网络设置
          </Button>
        }
      />
      <div className="w-full mt-5 text-sm text-color-desc flex flex-col items-center justify-center gap-5">
        使用{deviceName}扫描下方二维码即可访问
        <div className="bg-white p-4 rounded-3xl w-[204px] h-[204px] flex items-center justify-center shrink-0">
          {url ? (
            <div className="w-[172px] h-[172px]">
              <StyledQRCode url={url} targetSize={172} />
            </div>
          ) : (
            <div className="w-[172px] h-[172px] rounded-2xl bg-white" />
          )}
        </div>
        或在{deviceName}浏览器中手动输入 URL 进行访问
      </div>
    </div>
  );
};

const CustomRadio = (props : any) => {
  const {children, ...otherProps} = props;

  return (
    <Radio
      {...otherProps}
      classNames={{
        base: cn(
          "inline-flex m-0 bg-content1 hover:bg-content2 items-center justify-between",
          "flex-row-reverse max-w-none w-full cursor-pointer rounded-lg gap-4 px-5 py-3 border-2 border-transparent",
          "data-[selected=true]:border-primary transition-all duration-150",
        ),
        label: "text-sm",
        description: "text-xs font-jetbrains text-default-400 mt-1",
      }}
    >
      {children}
    </Radio>
  );
};

const DeviceCard = ({
                      name,
                      ip,
                      online,
                    }: DeviceCardProps) => {
  return (
    <div className="bg-[#1a1a1d] border border-white/[0.04] rounded-xl px-4 py-[18px] text-center transition-all duration-200 hover:bg-[#1e1e21] hover:border-white/[0.06] hover:-translate-y-0.5">
      <div className="relative mx-auto mb-3 flex h-[46px] w-[46px] items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-blue-700/[0.08]">
        {
          name === "本机"
            ? <Monitor className="h-5 w-5 text-blue-400" />
            : <MonitorSmartphone className="h-5 w-5 text-blue-400" />
        }
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-gray-900 ${
            online
              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
              : "bg-gray-500"
          }`}
        />
      </div>
      <div className="mb-1 truncate text-xs text-foreground cursor-default font-poppins">
        {name}
      </div>
      <div className="text-[11px] text-default-400 cursor-default font-jetbrains">
        {ip}
      </div>
    </div>
  );
};

export const IntegrationCard: React.FC<IntegrationCardProps> = ({path, profileId}) => {
  const [access, setAccess] = useState<string>("pc");
  const [selectedIp, setSelectedIp] = useState<string>("");

  // 网络接口相关状态
  const [networkInterfaces, setNetworkInterfaces] = useState<NetworkInterface[]>([]);
  const [isLoadingInterfaces, setIsLoadingInterfaces] = useState<boolean>(false);
  const [interfacesFetched, setInterfacesFetched] = useState<boolean>(false);
  const [hasInitiallyFetchedInterfaces, setHasInitiallyFetchedInterfaces] = useState<boolean>(false);

  // 局域网设备相关状态
  const [lanDevices, setLanDevices] = useState<string[]>([]);
  const [isInitialDevicesLoad, setIsInitialDevicesLoad] = useState<boolean>(true);

  // 轮询相关
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isModalOpenRef = useRef<boolean>(false);

  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onOpenChange: onModalOpenChange,
  } = useDisclosure();

  // 同步isModalOpen到ref
  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // 获取网络接口（用于Tab切换，静默请求）
  const fetchNetworkInterfacesSilent = useCallback(async () => {
    try {
      const response = await fetch("/api/system/networkInterfaces");
      const text = await response.text();

      if (text.includes("Error:")) {
        throw new Error(text);
      }

      const data: NetworkInterface[] = JSON.parse(text);
      setNetworkInterfaces(data);
      if (data.length > 0) {
        // 使用函数式更新，只有当前值为空或不在列表中时才更新
        setSelectedIp(prevIp => {
          const prevIpExists = data.some(iface => iface.ipAddress === prevIp);
          if (prevIpExists && prevIp) {
            return prevIp;
          }
          return data[0].ipAddress;
        });
      }
      setInterfacesFetched(true);
    } catch (err) {
      console.error("可用网络接口获取失败", err);
      addToast({
        title: "可用网络接口获取失败",
        description: (err as Error).message,
        color: "danger",
        timeout: 6000,
      });
    }
  }, []);

  // 获取网络接口（用于Modal打开，显示加载状态）
  const fetchNetworkInterfacesForModal = useCallback(async () => {
    setIsLoadingInterfaces(true);
    setNetworkInterfaces([]);
    setLanDevices([]);
    setInterfacesFetched(false);
    setIsInitialDevicesLoad(true);

    try {
      const response = await fetch("/api/system/networkInterfaces");
      const text = await response.text();

      if (text.includes("Error:")) {
        throw new Error(text);
      }

      const data: NetworkInterface[] = JSON.parse(text);
      setNetworkInterfaces(data);
      if (data.length > 0) {
        // 使用函数式更新，只有当前值为空或不在列表中时才更新
        setSelectedIp(prevIp => {
          const prevIpExists = data.some(iface => iface.ipAddress === prevIp);
          if (prevIpExists && prevIp) {
            return prevIp;
          }
          return data[0].ipAddress;
        });
      }
      setInterfacesFetched(true);
    } catch (err) {
      console.error("可用网络接口获取失败：", err);
      addToast({
        title: "可用网络接口获取失败",
        description: (err as Error).message,
        color: "danger",
        timeout: 6000,
      });
      setNetworkInterfaces([]);
      setInterfacesFetched(true);
    } finally {
      setIsLoadingInterfaces(false);
    }
  }, []);

  // 获取局域网设备
  const fetchLanDevices = useCallback(async (ip: string, isInitial: boolean) => {
    if (!ip || !isModalOpenRef.current) return;

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/system/lanDevices?localIp=${encodeURIComponent(ip)}`, {
        signal: abortControllerRef.current.signal,
      });
      const text = await response.text();

      if (text.includes("Error:")) {
        throw new Error(text);
      }

      const data: string[] = JSON.parse(text);

      if (isModalOpenRef.current) {
        setLanDevices(data);
        setIsInitialDevicesLoad(false);

        // 轮询：2秒后再次请求
        pollingTimeoutRef.current = setTimeout(() => {
          fetchLanDevices(ip, false);
        }, 2000);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("局域网设备获取失败：", error);
        addToast({
          title: "局域网设备获取失败",
          description: (error as Error).message,
          color: "danger",
          timeout: 6000,
        });
        if (isModalOpenRef.current) {
          setLanDevices([]);
          setIsInitialDevicesLoad(false);
        }
      }
    }
  }, []);

  // Tab切换时（首次切换到mobile/tablet）获取网络接口
  useEffect(() => {
    if ((access === "mobile" || access === "tablet") && !hasInitiallyFetchedInterfaces) {
      fetchNetworkInterfacesSilent();
      setHasInitiallyFetchedInterfaces(true);
    }
  }, [access, hasInitiallyFetchedInterfaces, fetchNetworkInterfacesSilent]);

  // Modal打开时获取网络接口
  useEffect(() => {
    if (isModalOpen) {
      fetchNetworkInterfacesForModal();
    } else {
      // Modal关闭时停止轮询
      stopPolling();
    }
  }, [isModalOpen, fetchNetworkInterfacesForModal, stopPolling]);

  // 当selectedIp改变且网络接口已获取成功时，获取局域网设备
  useEffect(() => {
    if (isModalOpen && interfacesFetched && networkInterfaces.length > 0 && selectedIp) {
      // 停止之前的轮询
      stopPolling();
      // 重置状态并开始新的获取
      setLanDevices([]);
      setIsInitialDevicesLoad(true);
      fetchLanDevices(selectedIp, true);
    }

    return () => {
      stopPolling();
    };
  }, [selectedIp, interfacesFetched, networkInterfaces.length, isModalOpen, stopPolling, fetchLanDevices]);

  const localUrl =
    profileId === "main"
      ? `http://localhost:9863${path}`
      : `http://localhost:9863${path}/${profileId}`;

  const lanUrl =
    profileId === "main"
      ? `http://${selectedIp}:9863${path}`
      : `http://${selectedIp}:9863${path}/${profileId}`;

  // 渲染网络接口列表
  const renderNetworkInterfaces = () => {
    if (isLoadingInterfaces) {
      return (
        <div className="flex flex-col gap-2.5">
          <Skeleton className="rounded-lg opacity-30">
            <div className="h-[64px] rounded-lg bg-default-200" />
          </Skeleton>
          <Skeleton className="rounded-lg opacity-30">
            <div className="h-[64px] rounded-lg bg-default-200" />
          </Skeleton>
          <Skeleton className="rounded-lg opacity-30">
            <div className="h-[64px] rounded-lg bg-default-200" />
          </Skeleton>
        </div>
      );
    }

    if (networkInterfaces.length === 0) {
      return (
        <div className="h-[155px] flex items-center justify-center">
          <span className="text-default-400 text-sm">无法获取网络接口</span>
        </div>
      );
    }

    return (
      <RadioGroup
        classNames={{
          wrapper: `gap-2.5 ${networkInterfaces.length > 3 ? "mr-3" : ""}`,
        }}
        value={selectedIp}
        onValueChange={(val) => {
          setSelectedIp(val);
        }}
      >
        {networkInterfaces.map((iface) => (
          <CustomRadio key={iface.ipAddress} value={iface.ipAddress} description={iface.ipAddress}>
            {iface.name}
          </CustomRadio>
        ))}
      </RadioGroup>
    );
  };

  // 渲染局域网设备
  const renderLanDevices = () => {
    // 如果网络接口还在加载，显示空白占位
    if (isLoadingInterfaces) {
      return null;
    }

    // 如果网络接口加载完成但为空，显示无法获取
    if (interfacesFetched && networkInterfaces.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <span className="text-default-400 text-sm">无法获取局域网设备</span>
        </div>
      );
    }

    // 如果正在初次加载设备
    if (isInitialDevicesLoad) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-3">
          <Spinner color="primary" />
          <span className="text-default-400 text-sm">正在扫描局域网设备...</span>
        </div>
      );
    }

    // 如果设备列表为空
    if (lanDevices.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <span className="text-default-400 text-sm">无法获取局域网设备</span>
        </div>
      );
    }

    // 正常显示设备列表
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 py-1 ${lanDevices.length > 3 ? "mr-4" : ""}`}>
        {lanDevices.map((ip, index) => (
          <DeviceCard
            key={ip}
            name={index === 0 ? "本机" : `设备 ${index}`}
            ip={ip}
            online
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Card className="max-w-full w-full">
        <CardBody className="overflow-hidden px-10 py-6">
          <span className="text-primary-900 text-xs font-bold">访问方式</span>
          <Tabs
            className="mt-2 mb-2"
            classNames={{
              tabList: "p-1",
              tab: "h-9",
              tabContent: "text-default-600",
              panel: "px-0",
            }}
            fullWidth
            selectedKey={access}
            size="lg"
            onSelectionChange={(key) => {
              setAccess(String(key));
            }}
          >
            <Tab
              key="pc"
              title={
                <div className="flex justify-center items-center gap-2">
                  <Monitor size={16} />
                  <span className="text-sm">电脑</span>
                </div>
              }
            >
              <PcTab url={localUrl} />
            </Tab>
            <Tab
              key="mobile"
              title={
                <div className="flex justify-center items-center gap-2">
                  <Smartphone size={16} />
                  <span className="text-sm">手机</span>
                </div>
              }
            >
              <MobileTab
                url={selectedIp ? lanUrl : localUrl}
                deviceName="手机"
                onModalOpen={onModalOpen}
              />
            </Tab>
            <Tab
              key="tablet"
              title={
                <div className="flex justify-center items-center gap-2">
                  <Tablet size={16} />
                  <span className="text-sm">平板</span>
                </div>
              }
            >
              <MobileTab
                url={selectedIp ? lanUrl : localUrl}
                deviceName="平板"
                onModalOpen={onModalOpen}
              />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      <Modal
        size="xl"
        isOpen={isModalOpen}
        onOpenChange={onModalOpenChange}
        onClose={() => {
          stopPolling();
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-xl">
                网络设置
              </ModalHeader>
              <ModalBody className="flex flex-col gap-4">
                <h2 className="text-base text-default-800 font-bold leading-6">
                  可用网络接口
                </h2>
                <ScrollShadow className="max-h-[230px] overflow-x-hidden">
                  {renderNetworkInterfaces()}
                </ScrollShadow>
                <div className="flex justify-between items-center leading-6 -mb-1">
                  <h2 className="text-base text-default-800 font-bold leading-6">
                    局域网设备
                  </h2>
                  <Chip
                    className="font-poppins"
                    size="sm"
                    variant="flat"
                  >
                    设备数量：{lanDevices.length}
                  </Chip>
                </div>
                <ScrollShadow className="min-h-[155px] h-[155px] overflow-x-hidden">
                  {renderLanDevices()}
                </ScrollShadow>
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
    </>
  );
};
