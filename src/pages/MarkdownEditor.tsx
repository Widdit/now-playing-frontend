import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/use-disclosure";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Rocket } from "@mynaui/icons-react";
import ReactMarkdown from "react-markdown";
import "@/styles/markdown.css";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/vs2015.css";

// 颜色配置常量
const COLOR_CONFIG = [
  { key: "blue", color: "#55a3fa", label: "蓝色" },
  { key: "pink", color: "#ff99c3", label: "粉色" },
  { key: "orange", color: "#f7b053", label: "橙色" },
] as const;

// 生成 span 标签的正则匹配模式
const generateSpanPattern = (color: string) =>
  `<span style="color: ${color};">`;

const MarkdownEditor: React.FC = () => {
  const [markdownText, setMarkdownText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isOpen: isUpdateModalOpen,
    onOpen: onUpdateModalOpen,
    onOpenChange: onUpdateModalOpenChange,
  } = useDisclosure();

  // 复制功能
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdownText);
    } catch (err) {
      console.error("复制失败:", err);
    }
  }, [markdownText]);

  // 颜色标记功能的通用处理
  const handleColorMark = useCallback(
    (color: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start === end) return; // 没有选中文字

      // 保存当前滚动位置
      const scrollTop = textarea.scrollTop;

      const selectedText = markdownText.substring(start, end);
      const beforeSelection = markdownText.substring(0, start);
      const afterSelection = markdownText.substring(end);

      const spanPrefix = generateSpanPattern(color);
      const spanSuffix = `</span>`;

      let newText: string;
      let newStart: number;
      let newEnd: number;

      // 情况1：选中的是纯文本，但前后有 span 标签包裹
      if (
        beforeSelection.endsWith(spanPrefix) &&
        afterSelection.startsWith(spanSuffix)
      ) {
        // 取消当前颜色包裹
        newText =
          beforeSelection.slice(0, -spanPrefix.length) +
          selectedText +
          afterSelection.slice(spanSuffix.length);
        newStart = start - spanPrefix.length;
        newEnd = newStart + selectedText.length;
      } else {
        // 情况2：检查选中的文本本身是否是一个完整的 span 标签
        let matchedColor: string | null = null;
        let innerText: string | null = null;

        for (const { color: existingColor } of COLOR_CONFIG) {
          const existingSpanPrefix = generateSpanPattern(existingColor);
          if (
            selectedText.startsWith(existingSpanPrefix) &&
            selectedText.endsWith(spanSuffix)
          ) {
            matchedColor = existingColor;
            innerText = selectedText.slice(
              existingSpanPrefix.length,
              -spanSuffix.length
            );
            break;
          }
        }

        if (matchedColor && innerText !== null) {
          if (matchedColor === color) {
            // 相同颜色，取消包裹
            newText = beforeSelection + innerText + afterSelection;
            newStart = start;
            newEnd = start + innerText.length;
          } else {
            // 不同颜色，替换为新颜色
            newText =
              beforeSelection + spanPrefix + innerText + spanSuffix + afterSelection;
            newStart = start + spanPrefix.length;
            newEnd = newStart + innerText.length;
          }
        } else {
          // 情况3：检查选中文本前后是否有其他颜色的 span 包裹
          let existingColorPrefix: string | null = null;

          for (const { color: existingColor } of COLOR_CONFIG) {
            const existingSpanPrefix = generateSpanPattern(existingColor);
            if (
              beforeSelection.endsWith(existingSpanPrefix) &&
              afterSelection.startsWith(spanSuffix)
            ) {
              existingColorPrefix = existingSpanPrefix;
              break;
            }
          }

          if (existingColorPrefix) {
            // 已被其他颜色包裹，替换为新颜色
            newText =
              beforeSelection.slice(0, -existingColorPrefix.length) +
              spanPrefix +
              selectedText +
              afterSelection;
            newStart = start - existingColorPrefix.length + spanPrefix.length;
            newEnd = newStart + selectedText.length;
          } else {
            // 情况4：普通文本，添加新包裹
            newText =
              beforeSelection +
              spanPrefix +
              selectedText +
              spanSuffix +
              afterSelection;
            newStart = start + spanPrefix.length;
            newEnd = newStart + selectedText.length;
          }
        }
      }

      setMarkdownText(newText);

      // 恢复选中状态和滚动位置
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(newStart, newEnd);
        textarea.scrollTop = scrollTop;
      });
    },
    [markdownText]
  );

  return (
    <div className="flex h-screen w-screen bg-[#18181b]">
      {/* 左侧编辑区域 */}
      <div className="flex flex-col w-1/2 h-full p-6 border-r border-gray-800">
        {/* 顶部标题和复制按钮 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-200">Markdown 编辑器</h2>
          <Button color="default" onPress={handleCopy}>
            复制
          </Button>
        </div>

        {/* 编辑区域 */}
        <textarea
          ref={textareaRef}
          value={markdownText}
          onChange={(e) => setMarkdownText(e.target.value)}
          placeholder="在此输入 Markdown 文本..."
          className="flex-1 w-full p-4 bg-[#27272a] text-gray-200 rounded-lg resize-none outline-none font-mono text-sm leading-relaxed border border-gray-700 placeholder-gray-500"
          spellCheck={false}
        />

        {/* 底部颜色按钮栏 */}
        <div className="flex flex-wrap gap-3 mt-4">
          {COLOR_CONFIG.map(({ key, color, label }) => (
            <Button
              key={key}
              style={{ backgroundColor: color }}
              className="text-white font-medium"
              onPress={() => handleColorMark(color)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* 右侧预览区域 */}
      <div className="w-1/2 h-full p-6 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-200">Markdown 预览</h2>
          <Button color="default" onPress={onUpdateModalOpen}>
            打开预览窗口
          </Button>
        </div>
        <div className="flex-1 p-6 bg-[#27272a] rounded-lg border border-gray-700 overflow-auto">
          <div className="markdown-body font-poppins">
            <ReactMarkdown
              rehypePlugins={[rehypeRaw, rehypeHighlight]}
              components={{
                img: ({ node, ...props }) => (
                  <img
                    {...props}
                    className="max-w-full h-auto rounded-lg my-2"
                    loading="lazy"
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
              {markdownText}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Modal 预览 */}
      <Modal
        size="xl"
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
                  2.0.0 新版本可用
                </div>
                <div className="font-normal text-sm text-default-500">
                  3 天前
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
                          className="max-w-full h-auto rounded-lg my-2"
                          loading="lazy"
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
                    {markdownText}
                  </ReactMarkdown>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="flat" onPress={onClose}>
                  取消
                </Button>
                <Button color="primary" onPress={onClose}>
                  确定
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default MarkdownEditor;
