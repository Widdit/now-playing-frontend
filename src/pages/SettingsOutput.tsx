import React, { useState, useEffect } from "react";
import { Image } from "@heroui/image";
import { Code } from "@heroui/code";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/drawer";
import { Spacer } from "@heroui/spacer";
import { Alert } from "@heroui/alert";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/use-disclosure";
import { Textarea } from "@heroui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Snippet } from "@heroui/snippet";
import { addToast } from "@heroui/toast";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

import { CopyIcon, CheckIcon } from "@/components/Icons";

interface CustomSnippetProps {
  content: string;
}

const CustomSnippet = ({ content }: CustomSnippetProps) => {
  return (
    <Snippet
      checkIcon={<CheckIcon size={14} />}
      className="bg-transparent px-0 py-0 gap-0"
      classNames={{
        copyButton: "min-w-6 w-6 h-6 ml-1",
      }}
      copyIcon={<CopyIcon size={14} />}
      disableTooltip={true}
      hideSymbol={true}
      size="sm"
      timeout={1500}
    >
      <span className="font-poppins text-sm">{content}</span>
    </Snippet>
  );
};

export default function OutputSettingsPage() {
  const [template, setTemplate] = useState<string>("");

  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onOpenChange: onDrawerOpenChange,
  } = useDisclosure();

  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onOpenChange: onModalOpenChange,
  } = useDisclosure();

  // 回显设置
  useEffect(() => {
    fetch("/api/settings/output")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP 响应错误！状态码：${res.status}`);
        }

        return res.json();
      })
      .then((data) => {
        if (data?.template) {
          setTemplate(data.template);
        }
      })
      .catch((err) => {
        console.error("加载设置失败：", err);
        addToast({
          title: "加载设置失败",
          description: err.message,
          color: "danger",
          timeout: 6000,
        });
      });
  }, []);

  // 保存模板
  const handleSave = () => {
    fetch("/api/settings/output", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP 响应错误！状态码：${res.status}`);
      })
      .then(() => {
        console.log("模板已保存");
        addToast({
          title: "保存成功",
          description: "已成功修改设置",
          timeout: 2000,
        });
      })
      .catch((err) => {
        console.error(err);
        addToast({
          title: "保存失败",
          description: err.message,
          color: "danger",
          timeout: 6000,
        });
      });
  };

  // 恢复默认
  const handleReset = () => {
    fetch("/api/settings/output/reset")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP 响应错误！状态码：${res.status}`);

        return res;
      })
      .then((res) => res.json())
      .then((data) => {
        if (data?.template) {
          setTemplate(data.template);
        }
      })
      .then(() => {
        console.log("模板已恢复默认");
        addToast({
          title: "保存成功",
          description: "已成功修改设置",
          timeout: 2000,
        });
      })
      .catch((err) => {
        console.error("恢复默认失败：", err);
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
        <h1 className="text-3xl text-white font-bold leading-9">
          歌曲信息输出
        </h1>

        <div className="flex items-center justify-center w-full">
          <Alert
            description="系统会生成包含当前歌曲信息的文件，供直播软件读取并自定义展示歌曲信息"
            endContent={
              <Button size="sm" variant="flat" onPress={onDrawerOpen}>
                查看教程
              </Button>
            }
            variant="faded"
          />
        </div>

        {/* 模板配置 */}
        <div className="flex flex-col gap-4">
          <h1 className="text-xl text-default-800 font-bold leading-9">
            模板配置
          </h1>
          <Textarea
            className="font-poppins"
            maxRows={10}
            minRows={5}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          />
          <div className="flex w-full justify-end gap-2">
            <Button className="px-5" color="default" onPress={onModalOpen}>
              恢复默认
            </Button>
            <Button className="px-5" color="primary" onPress={handleSave}>
              保存模板
            </Button>
          </div>

          <Spacer y={0.5} />

          <Table
            aria-label="占位符表格"
            className="font-poppins"
            selectionMode="single"
          >
            <TableHeader>
              <TableColumn>占位符</TableColumn>
              <TableColumn>含义</TableColumn>
              <TableColumn>示例值</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow key="1">
                <TableCell>
                  <CustomSnippet content="{title}" />
                </TableCell>
                <TableCell>歌名</TableCell>
                <TableCell>Creepin'</TableCell>
              </TableRow>
              <TableRow key="2">
                <TableCell>
                  <CustomSnippet content="{author}" />
                </TableCell>
                <TableCell>歌手名</TableCell>
                <TableCell>The Weeknd / 21 Savage</TableCell>
              </TableRow>
              <TableRow key="3">
                <TableCell>
                  <CustomSnippet content="{album}" />
                </TableCell>
                <TableCell>专辑名</TableCell>
                <TableCell>HEROES & VILLAINS</TableCell>
              </TableRow>
              <TableRow key="4">
                <TableCell>
                  <CustomSnippet content="{duration}" />
                </TableCell>
                <TableCell>时长(秒)</TableCell>
                <TableCell>221</TableCell>
              </TableRow>
              <TableRow key="5">
                <TableCell>
                  <CustomSnippet content="{durationHuman}" />
                </TableCell>
                <TableCell>时长</TableCell>
                <TableCell>3:41</TableCell>
              </TableRow>
              <TableRow key="6">
                <TableCell>
                  <CustomSnippet content="{firstAuthor}" />
                </TableCell>
                <TableCell>第一歌手名</TableCell>
                <TableCell>The Weeknd</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <Spacer y={0} />

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
                      在{" "}
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
                      的 <Code className="font-jetbrains">Outputs</Code>{" "}
                      文件夹中会自动输出包含歌曲信息的文件；
                    </li>
                    <li className="ps-1 leading-8">
                      其中 <Code className="font-jetbrains">title.txt</Code>{" "}
                      为歌名，<Code className="font-jetbrains">author.txt</Code>{" "}
                      为歌手名，
                      <Code className="font-jetbrains">cover.jpg</Code> 为封面；
                    </li>
                    <li className="ps-1 leading-8">
                      在直播软件中添加文本，选择 "从文件读取"（封面图片同理）；
                    </li>
                    <li className="ps-1 leading-8">
                      此外，您还可以通过配置模板输出自定义的文本内容{" "}
                      <Code className="font-jetbrains">custom.txt</Code>{" "}。
                    </li>
                  </ul>
                  <Spacer y={3} />
                  <Image
                    alt="歌曲信息输出帮助"
                    src="/assets/output-from-file-help.png"
                  />
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

        {/* 确认弹出框 */}
        <Modal isOpen={isModalOpen} onOpenChange={onModalOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">提示</ModalHeader>
                <ModalBody>
                  <p className="leading-7">您确定要恢复默认吗？</p>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="flat" onPress={onClose}>
                    取消
                  </Button>
                  <Button
                    color="primary"
                    onPress={() => {
                      onClose();
                      handleReset();
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
