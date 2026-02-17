// DefaultLayout.tsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import type { OverlayScrollbarsComponentRef } from "overlayscrollbars-react";

import { Sidebar } from "@/components/Sidebar";
import { useEnv } from "@/contexts/EnvContext";
import TitleBar from "@/components/TitleBar";

export default function DefaultLayout() {
  const { isDesktop } = useEnv();
  const { pathname } = useLocation();
  const scrollRef = useRef<OverlayScrollbarsComponentRef<"div">>(null);

  // 跟踪滚动状态
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // 更新滚动状态
  const updateScrollState = useCallback(() => {
    const osInstance = scrollRef.current?.osInstance();

    if (osInstance) {
      const { viewport } = osInstance.elements();
      const { scrollTop, scrollHeight, clientHeight } = viewport;

      // 判断是否可以向上/向下滚动
      // 使用 > 0 而不是 > 1 可以更灵敏地检测顶部
      setCanScrollUp(scrollTop > 0);
      // 增加 1px 的容错
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 1);
    }
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const osInstance = scrollRef.current?.osInstance();

    if (osInstance) {
      const { viewport } = osInstance.elements();
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior,
      });
    }
  }, []);

  // 生成 mask-image 样式
  const maskStyle = useMemo(() => {
    // 遮罩的高度（渐变区域的大小）
    const maskSize = "40px";

    // 如果都不需要滚动，不需要遮罩
    if (!canScrollUp && !canScrollDown) return {};

    // 构建线性渐变
    // 逻辑：
    // 1. 顶部：如果能向上滚，从 transparent 开始到 black 40px；否则从 black 0 开始。
    // 2. 底部：如果能向下滚，中间 black 到 100% - 40px 处，结尾 transparent；否则 black 到 100%。
    const gradient = `linear-gradient(to bottom,
      ${canScrollUp ? `transparent, black ${maskSize}` : "black 0"},
      ${canScrollDown ? `black calc(100% - ${maskSize}), transparent` : "black 100%"}
    )`;

    return {
      maskImage: gradient,
      WebkitMaskImage: gradient, // 兼容 Safari/Chrome
    };
  }, [canScrollUp, canScrollDown]);

  // 监听 pathname 变化，一旦变化就将容器滚动到顶部
  useEffect(() => {
    const osInstance = scrollRef.current?.osInstance();

    if (osInstance) {
      const { viewport } = osInstance.elements();
      viewport.scrollTop = 0;
    }
    // 路由变化后重新计算滚动状态
    setTimeout(updateScrollState, 100);
  }, [pathname, updateScrollState]);

  // 监听窗口大小变化
  useEffect(() => {
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState]);

  return (
    <>
      {isDesktop && <TitleBar hasBackground={true} />}
      <div className="dark bg-background font-sans text-foreground antialiased min-h-screen">
        <div data-overlay-container="true">
          <div
            id="app-container"
            className="relative flex min-h-dvh flex-col bg-background bg-radial"
          >
            {/* 防止父级滚动 */}
            <div className="flex h-screen overflow-hidden">
              {/* 侧边栏 */}
              <div className="md:fixed md:top-0 md:left-0 md:h-screen md:w-72 md:border-r md:border-divider md:bg-background md:z-20">
                <Sidebar />
              </div>

              {/* 主体内容容器 */}
              <div
                className={`
                relative flex-1 md:ml-72
                ${isDesktop ? "mt-8 h-[calc(100vh-32px)]" : "h-screen"}
              `}
              >
                {/* 滚动内容 */}
                <OverlayScrollbarsComponent
                  ref={scrollRef}
                  className="h-full w-full"
                  style={maskStyle}
                  options={{
                    scrollbars: {
                      autoHide: "leave",
                      autoHideDelay: 500,
                      theme: "os-theme-dark",
                    },
                    overflow: {
                      x: "hidden",
                      y: "scroll",
                    },
                  }}
                  events={{
                    scroll: updateScrollState,
                    initialized: updateScrollState,
                  }}
                  defer
                >
                  {/* 移动端避开顶部导航栏/状态栏，Web 端根据需要调整 */}
                  <div className="h-full pt-12 pb-4 md:pt-0 md:pb-0">
                    <Outlet context={{ scrollToBottom }} />
                  </div>
                </OverlayScrollbarsComponent>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
