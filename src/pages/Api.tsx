import React, { useState, useRef, useEffect, useCallback } from "react";

import { ApiListItem } from "@/components/ApiListItem";

import { RadioGroup } from "@heroui/radio";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Input } from "@heroui/input";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button, ButtonGroup } from "@heroui/button";
import { Spacer } from "@heroui/spacer";
import Editor from "react-simple-code-editor";
import hljs from "highlight.js";
import "highlight.js/styles/vs2015.css";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Zap } from "@mynaui/icons-react";

import { HTTP_STATUS_TEXT } from "@/constants/httpStatusText";
import { API_LIST } from "@/constants/apiList";
import { Send } from "@/components/animate-icons/Send";
import { Link } from "@/components/animate-icons/Link";
import { LinkTwo } from "@/components/animate-icons/LinkTwo";
import CopyButton from "@/components/CopyButton";

// 基础 URL
const BASE_URL = "localhost:9863";

// 获取状态码颜色类
const getStatusColorClass = (status: number): string => {
  if (status === 0) return "text-danger-500"; // 网络错误
  if (status >= 200 && status < 300) return "text-success-500";
  if (status >= 300 && status < 400) return "text-secondary-500";
  if (status >= 400 && status < 500) return "text-warning-500";
  if (status >= 500 && status < 600) return "text-danger-500";

  return "text-default-500";
};

// 获取状态码文字说明
const getStatusText = (status: number): string => {
  if (status === 0) return "Network Error";

  return HTTP_STATUS_TEXT[status] || "Unknown";
};

// 参数项类型
interface ParamItem {
  id: number;
  key: string;
  value: string;
}

// WebSocket 消息类型
interface WsMessage {
  id: number;
  type: "sent" | "received" | "system";
  content: string;
  timestamp: Date;
}

export default function ApiPage() {
  // 获取默认选中的 API
  const defaultApi = API_LIST[0];

  // 当前选中的 API 路径
  const [selectedApiPath, setSelectedApiPath] = useState<string>(defaultApi?.path || "");

  // 请求方式
  const [requestMethod, setRequestMethod] = useState<string>(defaultApi?.method || "GET");

  // 请求 URL
  const [requestUrl, setRequestUrl] = useState<string>(`http://${BASE_URL}${defaultApi?.path || ""}`);

  // 查询参数
  const [params, setParams] = useState<ParamItem[]>(() => {
    if (
      defaultApi?.params &&
      Array.isArray(defaultApi.params) &&
      defaultApi.params.length > 0
    ) {
      return defaultApi.params.map((param: any, index: number) => ({
        id: Date.now() + index,
        key: param.key || "",
        value: param.value || "",
      }));
    }

    return [];
  });

  // 请求体内容
  const [requestBodyContent, setRequestBodyContent] = useState<string>(() => {
    if (defaultApi?.body) {
      return typeof defaultApi.body === "string"
        ? defaultApi.body
        : JSON.stringify(defaultApi.body, null, 2);
    }

    return "";
  });

  // 响应内容
  const [responseContent, setResponseContent] = useState<string>("");

  // 响应状态码
  const [responseStatus, setResponseStatus] = useState<number | null>(null);

  // 请求用时（毫秒）
  const [responseTime, setResponseTime] = useState<number | null>(null);

  // 是否已发送过请求（用于判断是否显示提示信息）
  const [hasRequested, setHasRequested] = useState<boolean>(false);

  // 请求加载状态
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 发送按钮 hover 状态
  const [isSendHovered, setIsSendHovered] = useState<boolean>(false);

  // WS 连接按钮 hover 状态
  const [isConnectHovered, setIsConnectHovered] = useState<boolean>(false);

  // 创建 ref 用于控制滚动
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 使用 ref 记录上一次的参数长度，用于判断是新增还是删除
  const prevParamsLengthRef = useRef<number>(params.length);

  // ============ WebSocket 相关状态 ============
  // WebSocket 连接实例
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket 连接状态
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);

  // WebSocket 连接中状态
  const [isWsConnecting, setIsWsConnecting] = useState<boolean>(false);

  // WebSocket 消息列表
  const [wsMessages, setWsMessages] = useState<WsMessage[]>([]);

  // WebSocket 待发送消息
  const [wsMessageToSend, setWsMessageToSend] = useState<string>("");

  // WebSocket 消息滚动容器 ref
  const wsMessagesRef = useRef<HTMLDivElement>(null);

  // WebSocket 连接时间
  const [wsConnectTime, setWsConnectTime] = useState<Date | null>(null);

  // WebSocket 连接时长显示
  const [wsConnectionDuration, setWsConnectionDuration] = useState<string>("");

  // 处理请求方式变化
  const handleMethodChange = (method: string) => {
    setRequestMethod(method);
    // 如果切换到 GET 且请求体有内容，则清空请求体
    if (method === "GET" && requestBodyContent.trim()) {
      setRequestBodyContent("");
    }

    if (method === "WS") {
      setRequestUrl(requestUrl.replace("http://", "ws://"));
    } else {
      setRequestUrl(requestUrl.replace("ws://", "http://"));
    }
  };

  // 当选择的 API 变化时，更新调试台信息
  const handleApiChange = (path: string) => {
    // 如果当前有 WebSocket 连接，先断开
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsWsConnected(false);
      setIsWsConnecting(false);
    }

    setSelectedApiPath(path);

    const selectedApi = API_LIST.find((api) => api.path === path);

    if (selectedApi) {
      // 更新请求方式
      setRequestMethod(selectedApi.method);

      // 更新请求 URL
      if (selectedApi.method === "WS") {
        setRequestUrl(`ws://${BASE_URL}${selectedApi.path}`);
      } else {
        setRequestUrl(`http://${BASE_URL}${selectedApi.path}`);
      }

      // 更新查询参数
      if (
        selectedApi.params &&
        Array.isArray(selectedApi.params) &&
        selectedApi.params.length > 0
      ) {
        setParams(
          selectedApi.params.map((param: any, index: number) => ({
            id: Date.now() + index,
            key: param.key || "",
            value: param.value || "",
          })),
        );
      } else {
        setParams([]);
      }

      // 更新请求体（如果是 GET 或 WS 方式则不设置请求体）
      if (selectedApi.method !== "GET" && selectedApi.method !== "WS" && selectedApi.body) {
        setRequestBodyContent(
          typeof selectedApi.body === "string"
            ? selectedApi.body
            : JSON.stringify(selectedApi.body, null, 2),
        );
      } else {
        setRequestBodyContent("");
      }

      // 清空响应结果
      setResponseContent("");
      setResponseStatus(null);
      setResponseTime(null);
      setHasRequested(false);

      // 清空 WebSocket 消息
      setWsMessages([]);
      setWsMessageToSend("");
      setWsConnectTime(null);
    }
  };

  // 添加参数
  const addParam = () => {
    setParams([...params, { id: Date.now(), key: "", value: "" }]);
  };

  // 减少参数
  const removeParam = () => {
    if (params.length > 0) {
      setParams(params.slice(0, -1));
    }
  };

  // 更新参数
  const updateParam = (
    id: number,
    field: "key" | "value",
    newValue: string,
  ) => {
    setParams(
      params.map((param) =>
        param.id === id ? { ...param, [field]: newValue } : param,
      ),
    );
  };

  // 发送 HTTP 请求
  const sendRequest = async () => {
    setIsLoading(true);
    setHasRequested(true);

    const startTime = performance.now();

    try {
      // 构建 URL（包含查询参数）
      let url = requestUrl;

      if (params.length > 0) {
        const searchParams = new URLSearchParams();

        params.forEach((param) => {
          if (param.key) {
            searchParams.append(param.key, param.value);
          }
        });
        const queryString = searchParams.toString();

        if (queryString) {
          url += (url.includes("?") ? "&" : "?") + queryString;
        }
      }

      // 构建请求选项
      const options: RequestInit = {
        method: requestMethod,
        headers: {
          "Content-Type": "application/json",
          "X-Api-Debug": "true",  // 自定义调试标记，用于后端区分调试请求和正常请求
        },
      };

      // GET 请求不允许有 body
      if (requestMethod !== "GET" && requestBodyContent.trim()) {
        options.body = requestBodyContent;
      }

      const response = await fetch(url, options);
      const endTime = performance.now();

      setResponseStatus(response.status);
      setResponseTime(Math.round(endTime - startTime));

      // 尝试解析 JSON 响应
      const text = await response.text();

      try {
        const data = JSON.parse(text);

        setResponseContent(JSON.stringify(data, null, 2));
      } catch {
        // 如果不是 JSON，直接显示文本
        setResponseContent(text || "响应内容为空");
      }
    } catch (error) {
      const endTime = performance.now();

      setResponseTime(Math.round(endTime - startTime));
      setResponseStatus(0); // 网络错误使用状态码 0
      setResponseContent(
        JSON.stringify(
          {
            error: "请求失败",
            message: error instanceof Error ? error.message : "未知错误",
          },
          null,
          2,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============ WebSocket 相关方法 ============

  // 添加 WebSocket 消息到列表
  const addWsMessage = useCallback((type: WsMessage["type"], content: string) => {
    setWsMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        type,
        content,
        timestamp: new Date(),
      },
    ]);
  }, []);

  // 连接 WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    clearWsMessages();

    setIsWsConnecting(true);
    setHasRequested(true);

    // 构建 WebSocket URL（包含查询参数）
    let wsUrl = requestUrl;

    if (params.length > 0) {
      const searchParams = new URLSearchParams();

      params.forEach((param) => {
        if (param.key) {
          searchParams.append(param.key, param.value);
        }
      });
      const queryString = searchParams.toString();

      if (queryString) {
        wsUrl += (wsUrl.includes("?") ? "&" : "?") + queryString;
      }
    }

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsWsConnected(true);
        setIsWsConnecting(false);
        setWsConnectTime(new Date());
        addWsMessage("system", "WebSocket 连接已建立");
      };

      ws.onmessage = (event) => {
        let content = event.data;

        // 尝试格式化 JSON
        try {
          const parsed = JSON.parse(event.data);

          content = JSON.stringify(parsed, null, 2);
        } catch {
          // 保持原始内容
        }

        addWsMessage("received", content);
      };

      ws.onerror = (error) => {
        addWsMessage("system", `WebSocket 错误: ${error.type || "连接失败"}`);
        setIsWsConnecting(false);
      };

      ws.onclose = (event) => {
        setIsWsConnected(false);
        setIsWsConnecting(false);
        addWsMessage(
          "system",
          `WebSocket 连接已关闭 (Code: ${event.code}${event.reason ? `, Reason: ${event.reason}` : ""})`,
        );
        wsRef.current = null;
      };

      wsRef.current = ws;
    } catch (error) {
      setIsWsConnecting(false);
      addWsMessage(
        "system",
        `WebSocket 创建失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  }, [requestUrl, params, addWsMessage]);

  // 断开 WebSocket 连接
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, "User initiated disconnect");
      wsRef.current = null;
    }
  }, []);

  // 发送 WebSocket 消息
  const sendWsMessage = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && wsMessageToSend.trim()) {
      wsRef.current.send(wsMessageToSend);
      addWsMessage("sent", wsMessageToSend);
      setWsMessageToSend("");
    }
  }, [wsMessageToSend, addWsMessage]);

  // 清空 WebSocket 消息
  const clearWsMessages = useCallback(() => {
    setWsMessages([]);
  }, []);

  // 自动滚动到最新的 WebSocket 消息
  useEffect(() => {
    if (wsMessagesRef.current) {
      wsMessagesRef.current.scrollTop = wsMessagesRef.current.scrollHeight;
    }
  }, [wsMessages]);

  // 组件卸载时关闭 WebSocket 连接
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // WebSocket 连接时长计时器
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isWsConnected && wsConnectTime) {
      // 立即计算一次
      const calculateDuration = () => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - wsConnectTime.getTime()) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        setWsConnectionDuration(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      };
      calculateDuration();
      // 每秒更新一次
      intervalId = setInterval(calculateDuration, 1000);
    } else {
      setWsConnectionDuration("");
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isWsConnected, wsConnectTime]);

  // 自动滚动逻辑（参数列表）
  useEffect(() => {
    // 只有当是"新增"操作时才滚动
    if (params.length > prevParamsLengthRef.current) {
      // 等待 DOM 挂载和动画启动
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            // 滚动到最底部
            top: scrollContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 200);
    }
    prevParamsLengthRef.current = params.length;
  }, [params]);

  // 添加参数和删除参数的动画配置
  const transitionConfig = { duration: 0.25, ease: "easeInOut" } as const;

  // 判断是否为 GET 请求
  const isGetMethod = requestMethod === "GET";

  // 判断是否为 WebSocket 接口
  const isWsMethod = requestMethod === "WS";

  // 格式化时间
  const formatTime = (date: Date): string => {
    const time = date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const ms = date.getMilliseconds().toString().padStart(3, "0");
    return `${time}.${ms}`;
  };

  // 高亮 JSON 代码
  const highlightJson = (code: string): string => {
    return hljs.highlight(code, { language: "json" }).value;
  };

  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-full max-w-[800px] py-6 px-10 gap-6">
        <h1 className="text-3xl text-white font-bold leading-9">API 接口</h1>

        {/* 接口列表 */}
        <div className="flex flex-col gap-4">
          <h1 className="text-xl text-default-800 font-bold leading-9">
            接口列表
          </h1>
          <ScrollShadow className="h-[450px] overflow-x-hidden">
            <RadioGroup
              classNames={{
                wrapper: "gap-4 mr-3",
              }}
              value={selectedApiPath}
              onValueChange={handleApiChange}
            >
              {API_LIST.map((api) => (
                <ApiListItem
                  key={api.path}
                  body={api.body}
                  desc={api.desc}
                  info={api.info}
                  method={api.method}
                  params={api.params}
                  path={api.path}
                  tag={api.tag}
                  value={api.path}
                />
              ))}
            </RadioGroup>
          </ScrollShadow>
        </div>

        {/* 调试台 */}
        <div className="flex flex-col gap-4">
          <h1 className="text-xl text-default-800 font-bold leading-9">
            调试台
          </h1>
          <div className="flex gap-2">
            <Input
              className="font-jetbrains"
              classNames={{
                inputWrapper: "px-0",
                input: "pl-0!",
              }}
              endContent={
                <CopyButton copyContent={requestUrl} variant="light" />
              }
              startContent={
                <Dropdown classNames={{ content: "min-w-0 w-30" }}>
                  <DropdownTrigger>
                    <Button
                      className={`font-jetbrains min-w-none`}
                      variant="light"
                    >
                      {requestMethod}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    disallowEmptySelection
                    aria-label="Request method selection"
                    selectedKeys={new Set([requestMethod])}
                    selectionMode="single"
                    variant="flat"
                    onSelectionChange={(keys) => {
                      if (keys instanceof Set && keys.size > 0) {
                        const selectedKey = Array.from(keys)[0] as string;

                        handleMethodChange(selectedKey);
                      }
                    }}
                  >
                    <DropdownItem key="GET">GET</DropdownItem>
                    <DropdownItem key="POST">POST</DropdownItem>
                    <DropdownItem key="PUT">PUT</DropdownItem>
                    <DropdownItem key="DELETE">DELETE</DropdownItem>
                    <DropdownItem key="WS">WS</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              }
              type="text"
              variant="bordered"
              value={requestUrl}
              onValueChange={setRequestUrl}
            />
            {isWsMethod ? (
              // WebSocket 连接/断开按钮
              <Button
                className="px-5"
                color={isWsConnected ? "danger" : "primary"}
                isDisabled={isWsConnecting}
                isLoading={isWsConnecting}
                startContent={
                  !isWsConnecting && (
                    isWsConnected ? (
                      <LinkTwo
                        className="p-0"
                        isHovered={isConnectHovered}
                        size={16}
                        trigger="none"
                      />
                    ) : (
                      <Link
                        animation="default-loop"
                        className="p-0"
                        isHovered={isConnectHovered}
                        size={14}
                        trigger="none"
                      />
                    )
                  )
                }
                onPress={isWsConnected ? disconnectWebSocket : connectWebSocket}
                onMouseEnter={() => setIsConnectHovered(true)}
                onMouseLeave={() => setIsConnectHovered(false)}
              >
                {isWsConnecting ? "连接中" : isWsConnected ? "断开连接" : "建立连接"}
              </Button>
            ) : (
              // HTTP 发送请求按钮
              <Button
                className="px-5"
                color="primary"
                isDisabled={isLoading}
                isLoading={isLoading}
                startContent={
                  !isLoading && (
                    <Send
                      className="p-0"
                      isHovered={isSendHovered}
                      size={14}
                      trigger="none"
                    />
                  )
                }
                onMouseEnter={() => setIsSendHovered(true)}
                onMouseLeave={() => setIsSendHovered(false)}
                onPress={sendRequest}
              >
                发送请求
              </Button>
            )}
          </div>
          <LayoutGroup>
            <div className="flex gap-4 h-[573px]">
              <div className="flex flex-col flex-none w-full sm:w-[280px] md:w-[320px] lg:w-[360px] min-w-[220px] max-w-[40%]">
                <div className="flex justify-between items-center h-[26px]">
                  <span className="text-primary-900 text-xs font-bold">
                    查询参数
                  </span>
                  <ButtonGroup>
                    <Button
                      className="min-w-none w-[20px] h-[22px] text-[10px]"
                      radius="sm"
                      variant="flat"
                      onPress={removeParam}
                    >
                      –
                    </Button>
                    <Button
                      className="min-w-none w-[20px] h-[22px] text-[12px]"
                      radius="sm"
                      variant="flat"
                      onPress={addParam}
                    >
                      +
                    </Button>
                  </ButtonGroup>
                </div>
                <Spacer y={1} />
                <motion.div
                  layout
                  className="flex flex-col overflow-hidden"
                  style={{ maxHeight: 120 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                >
                  <ScrollShadow
                    ref={scrollContainerRef}
                    hideScrollBar
                    className="overflow-x-hidden w-full"
                    size={15}
                  >
                    <div className="flex flex-col w-full pb-1">
                      <AnimatePresence initial={false}>
                        {params.length === 0 ? (
                          <motion.div
                            key="empty-state"
                            animate={{ opacity: 1, height: 40 }}
                            className="flex flex-col items-center justify-center text-default-400 w-full overflow-hidden"
                            exit={{ opacity: 0, height: 0 }}
                            initial={{ opacity: 0, height: 0 }}
                            transition={transitionConfig}
                          >
                            <span className="text-xs italic">暂无查询参数</span>
                          </motion.div>
                        ) : (
                          params.map((item) => (
                            <motion.div
                              key={item.id}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              initial={{ opacity: 0, height: 0 }}
                              style={{ overflow: "hidden" }}
                              transition={transitionConfig}
                            >
                              <div className="flex gap-2 w-full mb-2 px-[1px]">
                                <Input
                                  className="font-jetbrains flex-1"
                                  placeholder="参数名称"
                                  size="sm"
                                  type="text"
                                  value={item.key}
                                  onValueChange={(value) =>
                                    updateParam(item.id, "key", value)
                                  }
                                />
                                <Input
                                  className="font-jetbrains flex-1"
                                  placeholder="参数值"
                                  size="sm"
                                  type="text"
                                  value={item.value}
                                  onValueChange={(value) =>
                                    updateParam(item.id, "value", value)
                                  }
                                />
                              </div>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </ScrollShadow>
                </motion.div>
                <Spacer y={2} />
                <span className="text-primary-900 text-xs font-bold">
                  {isWsMethod ? "发送消息" : "请求体"}
                </span>
                <Spacer y={2} />
                <motion.div
                  layout
                  className={`flex-1 flex flex-col min-h-0 rounded-xl bg-[#27272a] overflow-hidden transition-opacity duration-200 ${
                    isGetMethod ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                >
                  <div className="h-full overflow-auto flex flex-col">
                    {isWsMethod ? (
                      // WebSocket 发送消息区域
                      <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-auto">
                          <Editor
                            className="simple-code-editor font-jetbrains text-sm bg-[#27272a] hover:bg-[#2a2a2e] transition-all duration-100 ease h-full"
                            highlight={(code) =>
                              hljs.highlight(code, { language: "json" }).value
                            }
                            padding={10}
                            value={wsMessageToSend}
                            onValueChange={setWsMessageToSend}
                          />
                        </div>
                        <div className="flex gap-2 p-2 border-t border-[#3f3f46]">
                          {/* WebSocket 发送消息按钮 */}
                          <Button
                            className="flex-1"
                            color={(isWsConnected && wsMessageToSend.trim()) ? "primary" : "default"}
                            isDisabled={!isWsConnected || !wsMessageToSend.trim()}
                            size="sm"
                            onPress={sendWsMessage}
                          >
                            发送
                          </Button>
                        </div>
                      </div>
                    ) : isGetMethod ? (
                      <div className="h-full flex items-center justify-center text-default-400 text-xs italic">
                        GET 方式不支持请求体
                      </div>
                    ) : (
                      <Editor
                        className="simple-code-editor font-jetbrains text-sm bg-[#27272a] hover:bg-[#2a2a2e] transition-all duration-100 ease"
                        highlight={(code) =>
                          hljs.highlight(code, { language: "json" }).value
                        }
                        padding={10}
                        value={requestBodyContent}
                        onValueChange={setRequestBodyContent}
                      />
                    )}
                  </div>
                </motion.div>
              </div>
              <div className="flex flex-col flex-1 h-full min-w-0">
                <div className="flex justify-between items-center h-[26px]">
                  <span className="text-primary-900 text-xs font-bold">
                    {isWsMethod ? "消息记录" : "响应结果"}
                  </span>
                  {isWsMethod ? (
                    // WebSocket 状态信息
                    <div className="flex items-center gap-3 font-jetbrains text-xs">
                      {isWsConnected && (
                        <>
                          <span className="flex items-center gap-1 text-success-500">
                            <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                            已连接
                          </span>
                          <span className="text-zinc-600">|</span>
                          <span className="text-zinc-400">{wsConnectionDuration}</span>
                          <span className="text-zinc-600">|</span>
                        </>
                      )}
                      <Button
                        className="min-w-none h-[22px] text-[10px] px-2"
                        radius="sm"
                        size="sm"
                        variant="flat"
                        onPress={clearWsMessages}
                      >
                        清空
                      </Button>
                    </div>
                  ) : (
                    // HTTP 响应状态信息
                    hasRequested &&
                    responseStatus !== null &&
                    responseTime !== null && (
                      <div className="flex items-center gap-3 font-jetbrains text-xs">
                        <span
                          className={`font-bold ${getStatusColorClass(responseStatus)}`}
                        >
                          {responseStatus} {getStatusText(responseStatus)}
                        </span>
                        <span className="text-zinc-600">|</span>
                        <span className="text-zinc-400">{responseTime} ms</span>
                      </div>
                    )
                  )}
                </div>
                <Spacer y={1} />
                <div className="rounded-xl bg-transparent border-2 border-[#3f3f46] hover:border-[#71717a] transition-colors overflow-hidden flex-1 min-h-0 relative">
                  <div className="h-full overflow-auto" ref={isWsMethod ? wsMessagesRef : undefined}>
                    {isWsMethod ? (
                      // WebSocket 消息列表
                      !hasRequested ? (
                        <div className="h-full flex flex-col gap-2 items-center justify-center text-default-400 text-xs select-none">
                          <Zap size={30} />
                          <span>点击上方按钮建立 WebSocket 连接</span>
                        </div>
                      ) : wsMessages.length === 0 ? (
                        <div className="h-full flex flex-col gap-2 items-center justify-center text-default-400 text-xs select-none">
                          <span>等待消息...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 p-3">
                          {wsMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex flex-col gap-1 p-2 rounded-lg text-xs font-jetbrains ${
                                msg.type === "sent"
                                  ? "bg-default-100"
                                  : msg.type === "received"
                                    ? "bg-default-100"
                                    : "bg-default-100 text-default-500 italic text-center"
                              }`}
                            >
                              {msg.type !== "system" && (
                                <div className="flex justify-between items-center text-[10px] text-default-500">
                                  <span>
                                    {msg.type === "sent" ? "↑ 发送" : "↓ 接收"}
                                  </span>
                                  <span className="font-consolas">
                                    {formatTime(msg.timestamp)}
                                  </span>
                                </div>
                              )}
                              {msg.type === "received" || msg.type === "sent" ? (
                                <pre
                                  className="whitespace-pre-wrap break-all text-xs"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightJson(msg.content),
                                  }}
                                />
                              ) : (
                                <pre className="whitespace-pre-wrap break-all text-xs font-sans">
                                  {msg.content}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    ) : !hasRequested ? (
                      <div className="h-full flex flex-col gap-2 items-center justify-center text-default-400 text-xs select-none">
                        <Zap size={30} />
                        <span>点击上方按钮发送请求</span>
                      </div>
                    ) : isLoading ? (
                      <div className="h-full flex items-center justify-center text-default-400 text-xs">
                        请求中...
                      </div>
                    ) : (
                      <Editor
                        readOnly
                        className="simple-code-editor font-jetbrains text-sm bg-transparent"
                        highlight={(code) =>
                          hljs.highlight(code, { language: "json" }).value
                        }
                        padding={10}
                        value={responseContent}
                        onValueChange={() => {}}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </LayoutGroup>
        </div>

        <Spacer y={0} />
      </div>
    </div>
  );
}
