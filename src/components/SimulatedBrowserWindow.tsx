import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Tooltip } from "@heroui/tooltip";
import { ArrowUpRight, Redo } from "@mynaui/icons-react";

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export type SimulatedBrowserWindowProps = {
  /** iframe 地址 */
  iframeSrc: string;
  /** 用于强制刷新 iframe（传给 iframe 的 key） */
  iframeKey: React.Key;

  /** 点击“刷新”按钮 */
  onReload?: () => void;
  /** 点击“新窗口打开”按钮 */
  onOpenExternal?: () => void;

  /** 初始尺寸（px） */
  initialWidth?: number;
  initialHeight?: number;

  /** 尺寸约束（px） */
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;

  /** 页面是否会在 resize 过程中自动滚动到底部 */
  autoScrollToBottom? : boolean;

  /** resize 过程中回调（用于父级同步滚动到底部等） */
  onResizing?: () => void;
};

/**
 * 模拟浏览器窗口组件
 *
 * 功能：
 * 1. 自定义边框/角落拖拽缩放（支持上下左右边框 + 四角，悬停显示对应光标）。
 * 2. 隐藏浏览器原生 resize 右下角提示图案（不使用 CSS resize，并显式设为 resize: none）。
 * 3. resize 过程按帧更新，减少卡顿；并在 resize 过程中通过 onResizing 通知父级做同步操作（如滚动条到底部）。
 *
 * 说明：
 * - 组件使用居中布局（margin: auto）。若只改变宽高，左右/上下会各移动一半距离，导致“鼠标移动但边框跟不上”。
 * - 本实现改为：当拖动某一边时，另一边也同步移动（等价于以中心点为基准缩放），即把鼠标位移乘以 2 作用到宽高上，
 *   让被拖拽的那条边可以完整跟随鼠标，同时也避免了 resize 结束后再做视觉上的“回正/居中”处理。
 */
export default function SimulatedBrowserWindow({
                                                 iframeSrc,
                                                 iframeKey,
                                                 onReload,
                                                 onOpenExternal,
                                                 initialWidth = 720,
                                                 initialHeight = 572,
                                                 minWidth = 300,
                                                 maxWidth = 720,
                                                 minHeight = 120,
                                                 maxHeight = 2000,
                                                 autoScrollToBottom = false,
                                                 onResizing,
                                               }: SimulatedBrowserWindowProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });

  const isResizingRef = useRef(false);

  const resizeSessionRef = useRef<{
    handle: ResizeHandle;
    pointerId: number;
    captureEl: HTMLDivElement;

    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;

    parentWidth: number;
  } | null>(null);

  const pendingSizeRef = useRef<{ width: number; height: number } | null>(null);
  const sizeRafRef = useRef<number | null>(null);

  const prevBodyCursorRef = useRef<string>("");
  const prevBodyUserSelectRef = useRef<string>("");

  const stopResize = useCallback(() => {
    const session = resizeSessionRef.current;

    if (session) {
      try {
        if (session.captureEl.hasPointerCapture(session.pointerId)) {
          session.captureEl.releasePointerCapture(session.pointerId);
        }
      } catch {
        // ignore
      }
    }

    resizeSessionRef.current = null;
    isResizingRef.current = false;

    window.removeEventListener("pointermove", handleGlobalPointerMove);
    window.removeEventListener("pointerup", stopResize);
    window.removeEventListener("pointercancel", stopResize);
    window.removeEventListener("blur", stopResize);

    if (sizeRafRef.current != null) {
      cancelAnimationFrame(sizeRafRef.current);
      sizeRafRef.current = null;
    }

    if (pendingSizeRef.current) {
      setSize(pendingSizeRef.current);
      pendingSizeRef.current = null;
    }

    if (prevBodyCursorRef.current) {
      document.body.style.cursor = prevBodyCursorRef.current;
      prevBodyCursorRef.current = "";
    } else {
      document.body.style.cursor = "";
    }

    if (prevBodyUserSelectRef.current) {
      document.body.style.userSelect = prevBodyUserSelectRef.current;
      prevBodyUserSelectRef.current = "";
    } else {
      document.body.style.userSelect = "";
    }
  }, []);

  const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
    const session = resizeSessionRef.current;

    if (!session) return;

    const dx = e.clientX - session.startX;
    const dy = e.clientY - session.startY;

    let nextWidth = session.startWidth;
    let nextHeight = session.startHeight;

    const factor = autoScrollToBottom ? 1 : 2;

    // 关键：元素是居中的（左右/上下各分一半变化）。
    // 为了让“被拖拽的那条边”跟随鼠标，需要把位移乘以 2 转换成宽高变化量。
    if (session.handle.includes("e")) nextWidth = session.startWidth + dx * 2;
    if (session.handle.includes("w")) nextWidth = session.startWidth - dx * 2;
    if (session.handle.includes("s")) nextHeight = session.startHeight + dy * factor;
    if (session.handle.includes("n")) nextHeight = session.startHeight - dy * factor;

    // 宽度上限：同时受 maxWidth 与父容器宽度影响
    const maxAllowedWidth = Math.min(maxWidth, session.parentWidth);

    nextWidth = Math.max(minWidth, Math.min(maxAllowedWidth, nextWidth));
    nextHeight = Math.max(minHeight, Math.min(maxHeight, nextHeight));

    pendingSizeRef.current = { width: nextWidth, height: nextHeight };

    if (sizeRafRef.current != null) return;

    sizeRafRef.current = requestAnimationFrame(() => {
      if (pendingSizeRef.current) {
        setSize(pendingSizeRef.current);
        pendingSizeRef.current = null;
      }

      sizeRafRef.current = null;
    });
  }, [maxHeight, maxWidth, minHeight, minWidth, stopResize]);

  const beginResize = useCallback((handle: ResizeHandle, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const el = containerRef.current;

    if (!el) return;

    const elRect = el.getBoundingClientRect();
    const parentRect = el.parentElement?.getBoundingClientRect();

    const parentWidth = parentRect?.width ?? Infinity;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    resizeSessionRef.current = {
      handle,
      pointerId: e.pointerId,
      captureEl: e.currentTarget,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: elRect.width,
      startHeight: elRect.height,
      parentWidth,
    };

    isResizingRef.current = true;

    const cursorMap: Record<ResizeHandle, string> = {
      n: "ns-resize",
      s: "ns-resize",
      e: "ew-resize",
      w: "ew-resize",
      ne: "nesw-resize",
      sw: "nesw-resize",
      nw: "nwse-resize",
      se: "nwse-resize",
    };

    prevBodyCursorRef.current = document.body.style.cursor;
    document.body.style.cursor = cursorMap[handle];

    prevBodyUserSelectRef.current = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
    window.addEventListener("blur", stopResize);
  }, [handleGlobalPointerMove, stopResize]);

  useEffect(() => {
    return () => {
      stopResize();
    };
  }, [stopResize]);

  // resize 过程中：每次尺寸变化后（DOM 更新后）通知父级执行同步行为（如滚动到底部）
  useLayoutEffect(() => {
    if (!isResizingRef.current) return;
    if (!onResizing) return;

    requestAnimationFrame(() => {
      onResizing();
    });
  }, [onResizing, size.height, size.width]);

  return (
    <div
      ref={containerRef}
      className="rounded-lg flex flex-col group hover:ring-1 hover:ring-white/10 transition-[box-shadow,ring] duration-200"
      style={{
        position: "relative",
        overflow: "hidden",
        resize: "none",
        width: `${size.width}px`,
        maxWidth: "100%",
        minWidth: `${minWidth}px`,
        height: `${size.height}px`,
        minHeight: `${minHeight}px`,
        maxHeight: `${maxHeight}px`,
        margin: "8px auto",
      }}
    >
      {/* 标题栏 */}
      <div className="bg-default-400/5 flex h-8 w-full items-center justify-between px-4 flex-shrink-0 select-none">
        {/* 左侧圆点 */}
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-white/10" />
          <div className="w-3 h-3 rounded-full bg-white/10" />
          <div className="w-3 h-3 rounded-full bg-white/10" />
        </div>
        {/* 右侧按钮 */}
        <div className="flex items-center gap-2">
          <Tooltip
            className="px-3 font-poppins"
            closeDelay={200}
            content="刷新"
            delay={200}
            placement="left"
          >
            <Redo
              size={11}
              className="cursor-pointer text-default-400 hover:text-default-600 transition-colors"
              onClick={onReload}
            />
          </Tooltip>
          <Tooltip
            className="px-3 font-poppins"
            closeDelay={200}
            content="新窗口打开"
            delay={200}
            placement="right"
          >
            <ArrowUpRight
              className="cursor-pointer text-default-400 hover:text-default-600 transition-colors"
              size={13}
              onClick={onOpenExternal}
            />
          </Tooltip>
        </div>
      </div>

      {/* 网格背景 + iframe */}
      <div
        style={{
          backgroundColor: "#181818",
          backgroundImage:
            "linear-gradient(45deg, #27272a 25%, transparent 25%, transparent 75%, #27272a 75%, #27272a), " +
            "linear-gradient(45deg, #27272a 25%, transparent 25%, transparent 75%, #27272a 75%, #27272a)",
          backgroundPosition: "0 0, 10px 10px",
          backgroundSize: "20px 20px",
          flex: 1,
          width: "100%",
          position: "relative",
        }}
      >
        <iframe
          key={iframeKey}
          src={iframeSrc}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
            zIndex: 10,
            background: "transparent",
            colorScheme: "normal",
          }}
        />
      </div>

      {/* Resize 控制区 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 60 }}
      >
        {/* 边 */}
        <div
          className="absolute top-0 left-2 right-2 h-2 cursor-ns-resize pointer-events-auto"
          onPointerDown={(e) => beginResize("n", e)}
          style={{ touchAction: "none" }}
        />
        <div
          className="absolute bottom-0 left-2 right-2 h-2 cursor-ns-resize pointer-events-auto"
          onPointerDown={(e) => beginResize("s", e)}
          style={{ touchAction: "none" }}
        />
        <div
          className="absolute left-0 top-2 bottom-2 w-2 cursor-ew-resize pointer-events-auto"
          onPointerDown={(e) => beginResize("w", e)}
          style={{ touchAction: "none" }}
        />
        <div
          className="absolute right-0 top-2 bottom-2 w-2 cursor-ew-resize pointer-events-auto"
          onPointerDown={(e) => beginResize("e", e)}
          style={{ touchAction: "none" }}
        />

        {/* 角 */}
        <div
          className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize pointer-events-auto"
          onPointerDown={(e) => beginResize("nw", e)}
          style={{ touchAction: "none" }}
        />
        <div
          className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize pointer-events-auto"
          onPointerDown={(e) => beginResize("ne", e)}
          style={{ touchAction: "none" }}
        />
        <div
          className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize pointer-events-auto"
          onPointerDown={(e) => beginResize("sw", e)}
          style={{ touchAction: "none" }}
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize pointer-events-auto"
          onPointerDown={(e) => beginResize("se", e)}
          style={{ touchAction: "none" }}
        />
      </div>
    </div>
  );
}
