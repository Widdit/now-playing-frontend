import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/drawer";
import { Button } from "@heroui/button";
import { Spacer } from "@heroui/spacer";
import { Image } from "@heroui/image";
import { Divider } from "@heroui/divider";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Link } from "@heroui/link";

import { PLATFORM_MAP } from "@/constants/platformMap";
import { useOpenExternalUrl } from "@/hooks/useOpenExternalUrl";

interface PlatformHelpDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  platform: string;
  smtc: boolean;
  isConnected: boolean;
}

const NeteaseMusicHelpContent: React.FC = () => (
  <>
    <ul className="list-disc flex flex-col gap-2 ml-4">
      <li className="ps-1 leading-8">这种情况多出现于音频设备未设置正确</li>
      <li className="ps-1 leading-8">
        在{" "}
        <a className="custom-underline font-bold" href="/settings/general">
          通用
        </a>{" "}
        页面点击 "智能识别" 按钮，遵循提示操作
      </li>
      <li className="ps-1 leading-8">如果仍未解决，请联系开发者寻求帮助</li>
    </ul>
  </>
);

const QQMusicSmtcTrueHelpContent: React.FC = () => (
  <>
    <ul className="list-disc flex flex-col gap-2 ml-4">
      <li className="ps-1 leading-8">将 QQ 音乐升级至最新版</li>
      <li className="ps-1 leading-8">
        检查 QQ 音乐设置中的 "显示系统媒体传输控件（SMTC）"
        是否勾选，需要勾选此项才能识别
      </li>
      <li className="ps-1 leading-8">如果仍未解决，请联系开发者寻求帮助</li>
    </ul>
    <Spacer y={6} />
    <Image radius="md" src="/assets/qq-smtc-help.png" />
  </>
);

const KuGouMusicSmtcTrueHelpContent: React.FC = () => (
  <>
    <ul className="list-disc flex flex-col gap-2 ml-4">
      <li className="ps-1 leading-8">
        检查酷狗音乐设置中的 "支持系统播放控件" 是否勾选，需要勾选此项才能识别
      </li>
      <li className="ps-1 leading-8">如果仍未解决，请联系开发者寻求帮助</li>
    </ul>
    <Spacer y={6} />
    <Image radius="md" src="/assets/kugou-smtc-help.png" />
  </>
);

const AppleMusicSmtcFalseHelpContent: React.FC = () => {
  const { openExternalUrl } = useOpenExternalUrl();
  return (
    <>
      <ul className="list-disc flex flex-col gap-2 ml-4">
        <li className="ps-1 leading-8">
          在当前状态下，目标识别平台实际为 Cider{" "}
          <Chip size="sm" variant="faded">
            1.6.3
          </Chip>
        </li>
        <li className="ps-1 leading-8">
          若您希望直接识别 Apple Music，需开启 "优先使用 SMTC" 选项
        </li>
        <li className="ps-1 leading-8">
          若您确实需要通过 Cider{" "}
          <Chip size="sm" variant="faded">
            1.6.3
          </Chip>{" "}
          进行识别，请参照{" "}
          <Link
            className="cursor-pointer"
            showAnchorIcon
            onPress={() => {openExternalUrl("https://www.bilibili.com/video/BV1Ae6tYdEwa/?t=36s");}}
          >
            视频教程
          </Link>{" "}
          中的步骤完成配置
        </li>
        <li className="ps-1 leading-8">如果仍未解决，请联系开发者寻求帮助</li>
      </ul>
    </>
  )
};

const MieboHelpContent: React.FC = () => {
  const { openExternalUrl } = useOpenExternalUrl();
  return (
    <>
      <ul className="list-disc flex flex-col gap-2 ml-4">
        <li className="ps-1 leading-8">
          查看{" "}
          <Link
            className="cursor-pointer"
            showAnchorIcon
            onPress={() => {openExternalUrl("https://kdocs.cn/l/cck2G9Pjp5K4");}}
          >
            咩播点歌插件使用教程
          </Link>
        </li>
        <li className="ps-1 leading-8">
          检查咩播设置中的 "启用浏览器源" 是否勾选，需要勾选此项才能识别
        </li>
        <li className="ps-1 leading-8">如果仍未解决，请联系开发者寻求帮助</li>
      </ul>
      <Spacer y={6} />
      <Image radius="md" src="/assets/miebo-help.png" />
    </>
  )
};

const AynaLivePlayerHelpContent: React.FC = () => (
  <>
    <ul className="list-disc flex flex-col gap-2 ml-4">
      <li className="ps-1 leading-8">
        进入卡西米尔唱片机的设置页面，侧边栏选择 WebSocket 服务器
      </li>
      <li className="ps-1 leading-8">点击 "启动" 按钮，再勾选 "自动启用"</li>
      <li className="ps-1 leading-8">如果仍未解决，请联系开发者寻求帮助</li>
    </ul>
    <Spacer y={6} />
    <Image radius="md" src="/assets/ayna-help.png" />
  </>
);

const PotPlayerSmtcTrueHelpContent: React.FC = () => (
  <>
    <ul className="list-disc flex flex-col gap-2 ml-4">
      <li className="ps-1 leading-8">
        如需使用 SMTC 识别方式，需要确保所安装的 PotPlayer 版本为{" "}
        <Chip size="sm" variant="faded">
          240618
        </Chip>{" "}
        或{" "}
        <Link
          isExternal
          showAnchorIcon
          href="http://www.potplayercn.com/download"
        >
          更高版本
        </Link>
      </li>
      <li className="ps-1 leading-8">
        打开 PotPlayer 的 "选项" 界面，确保勾选 "使用系统媒体控件控制功能"
      </li>
      <li className="ps-1 leading-8">如果仍未解决，请联系开发者寻求帮助</li>
    </ul>
    <Spacer y={6} />
    <Image radius="md" src="/assets/potplayer-smtc-help.png" />
  </>
);

const AimpSmtcTrueHelpContent: React.FC = () => {
  const { openExternalUrl } = useOpenExternalUrl();
  return (
    <>
      <ul className="list-disc flex flex-col gap-2 ml-4">
        <li className="ps-1 leading-8">
          如需使用 SMTC 识别方式，需要按照{" "}
          <Link
            className="cursor-pointer"
            showAnchorIcon
            onPress={() => {openExternalUrl("https://www.kdocs.cn/l/clIiFQrPhHfW");}}
          >
            图文教程
          </Link>{" "}
          为 AIMP 安装插件
        </li>
        <li className="ps-1 leading-8">如果仍未解决，请联系开发者寻求帮助</li>
      </ul>
    </>
  )
};

const DefaultHelpContent: React.FC = () => {
  return (
    <>
      <ul className="list-disc flex flex-col gap-2 ml-4">
        <li className="ps-1 leading-8">
          进入{" "}
          <a className="custom-underline font-bold" href="/about">
            关于
          </a>{" "}
          页面，点击 "软件信息" 的复制按钮
        </li>
        <li className="ps-1 leading-8">
          联系开发者寻求帮助，并提供复制的软件信息
        </li>
      </ul>
    </>
  );
};

// 生成复合键的函数，将 platform 和 smtc 组合成唯一标识
const getContentKey = (platform: string, smtc: boolean) =>
  `${platform}-${smtc}`;

// 帮助内容映射表，使用复合键作为索引
const helpContentMap: Record<string, React.FC> = {
  [getContentKey("netease", true)]: NeteaseMusicHelpContent,
  [getContentKey("netease", false)]: NeteaseMusicHelpContent,
  [getContentKey("qq", true)]: QQMusicSmtcTrueHelpContent,
  [getContentKey("kugou", true)]: KuGouMusicSmtcTrueHelpContent,
  [getContentKey("apple", false)]: AppleMusicSmtcFalseHelpContent,
  [getContentKey("miebo", true)]: MieboHelpContent,
  [getContentKey("miebo", false)]: MieboHelpContent,
  [getContentKey("ayna", true)]: AynaLivePlayerHelpContent,
  [getContentKey("ayna", false)]: AynaLivePlayerHelpContent,
  [getContentKey("potplayer", true)]: PotPlayerSmtcTrueHelpContent,
  [getContentKey("aimp", true)]: AimpSmtcTrueHelpContent,
};

const PlatformHelpDrawer: React.FC<PlatformHelpDrawerProps> = ({
  isOpen,
  onOpenChange,
  platform,
  smtc,
  isConnected,
}) => {
  // 生成当前组合的唯一键
  const contentKey = getContentKey(platform, smtc);

  // 获取对应的帮助内容组件，未找到则使用默认组件
  const HelpContentComponent =
    helpContentMap[contentKey] ||
    ((props) => <DefaultHelpContent {...props} />);

  return (
    <Drawer isOpen={isOpen} size="lg" onOpenChange={onOpenChange} className="font-poppins">
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1">
              <h1 className="text-2xl text-default-800 font-bold leading-12">
                使用帮助
              </h1>
            </DrawerHeader>
            <DrawerBody>
              <div className="flex flex-col gap-6">
                <Card className="px-4 py-2">
                  <CardHeader>
                    <span className="text-small text-default-500">
                      当前状态
                    </span>
                  </CardHeader>
                  <Divider className="my-1" />
                  <CardBody>
                    <div className="flex flex-col gap-3">
                      <div className="flex w-full items-center justify-between">
                        <span>音乐平台</span>
                        <Chip
                          color={isConnected ? "success" : "warning"}
                          variant="bordered"
                        >
                          {PLATFORM_MAP[platform] ?? platform}
                        </Chip>
                      </div>
                      <div className="flex w-full items-center justify-between">
                        <span>优先使用 SMTC</span>
                        <Chip
                          color={isConnected ? "success" : "warning"}
                          variant="bordered"
                        >
                          {smtc ? "已开启" : "未开启"}
                        </Chip>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                <Card className="px-4 py-2">
                  <CardHeader>
                    <span className="text-small text-default-500">
                      解决方案
                    </span>
                  </CardHeader>
                  <Divider className="my-1" />
                  <CardBody>
                    <HelpContentComponent />
                  </CardBody>
                </Card>
              </div>
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
  );
};

export default PlatformHelpDrawer;
