import { Image } from "@heroui/image";
import { Cast } from "@mynaui/icons-react";
import { Server } from "lucide-react";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { useNavigate } from "react-router-dom";
import { Spacer } from "@heroui/spacer";
import React from "react";

export default function ExtensionPage() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-full max-w-[800px] py-6 px-10 gap-6">
        <h1 className="text-3xl text-white font-bold leading-9">扩展功能</h1>

        <div className="gap-4 grid grid-cols-2">
          {/* 窗口模式 */}
          <Card
            key="window"
            isHoverable
            isPressable
            className="transition-all duration-500 hover:scale-102"
            classNames={{
              footer: "p-5",
            }}
            shadow="sm"
            onPress={() => {
              navigate("/extension/window");
            }}
          >
            <CardBody className="overflow-visible p-0">
              <Image
                className="w-full object-cover h-[180px]"
                radius="lg"
                src="/assets/window-mode-preview.png"
                width="100%"
              />
            </CardBody>
            <CardFooter className="flex flex-col gap-2">
              <div className="w-full flex justify-between">
                <span className="text-lg text-white font-bold leading-6">
                  窗口模式
                </span>
                <Cast />
              </div>
              <p className="!text-left text-sm text-default-500 w-full">
                提供组件窗口给直播软件采集
              </p>
            </CardFooter>
          </Card>

          {/* 页面部署 */}
          <Card
            key="deployment"
            isHoverable
            isPressable
            className="transition-all duration-500 hover:scale-102"
            classNames={{
              footer: "p-5",
            }}
            shadow="sm"
            onPress={() => {
              navigate("/extension/deployment");
            }}
          >
            <CardBody className="overflow-visible p-0">
              <Image
                className="w-full object-cover h-[180px]"
                radius="lg"
                src="/assets/page-deployment-preview.png"
                width="100%"
              />
            </CardBody>
            <CardFooter className="flex flex-col gap-2">
              <div className="w-full flex justify-between">
                <span className="text-lg text-white font-bold leading-6">
                  页面部署
                </span>
                <Server size={22} strokeWidth={1.5} />
              </div>
              <p className="!text-left text-sm text-default-500 w-full">
                通过内置服务器部署前端页面
              </p>
            </CardFooter>
          </Card>
        </div>

        <Spacer y={2} />
      </div>
    </div>
  );
}
