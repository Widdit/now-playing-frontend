import React, { useEffect, useMemo, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

type Direction =
  | "North"
  | "South"
  | "East"
  | "West"
  | "NorthEast"
  | "NorthWest"
  | "SouthEast"
  | "SouthWest";

export type ResizeHotzonesProps = {
  /** 边缘热区厚度(px)，越大越好拖但越可能挡住贴边按钮 */
  thickness?: number;
  /** 角落热区大小(px) */
  cornerSize?: number;
  /** z-index，确保在最上层 */
  zIndex?: number;
  /** 是否启用 */
  enabled?: boolean;
  /**
   * 是否在鼠标按下时 stopPropagation（默认 true）
   * 如果有全局 pointerdown 逻辑（比如手势库）可能需要关掉
   */
  stopPropagation?: boolean;
};

/**
 * Windows 窗口在无边框（decorations: false）的情况下，会很难拖拽缩放。
 * 该组件可提供更易拖拽缩放的透明区域。
 * 用法：在 App.tsx 顶层加一次 <ResizeHotzones /> 即可。
 *
 * 改造：窗口在全屏、最大化状态下不提供 resize hotzone。
 */
export const ResizeHotzones: React.FC<ResizeHotzonesProps> = ({
                                                                thickness = 8,
                                                                cornerSize = 12,
                                                                zIndex = 2147483647,
                                                                enabled = true,
                                                                stopPropagation = true,
                                                              }) => {
  const winRef = useRef<ReturnType<typeof getCurrentWindow> | null>(null);
  if (!winRef.current) winRef.current = getCurrentWindow();

  // 是否允许展示/启用 resize 热区（全屏/最大化时关闭）
  const [hotzoneEnabled, setHotzoneEnabled] = useState<boolean>(false);

  // 刷新窗口状态：全屏或最大化时禁用热区
  useEffect(() => {
    if (!enabled) {
      setHotzoneEnabled(false);
      return;
    }

    let disposed = false;

    const refresh = async () => {
      try {
        const win = winRef.current!;
        const [maximized, fullscreen] = await Promise.all([
          win.isMaximized(),
          win.isFullscreen(),
        ]);
        if (!disposed) setHotzoneEnabled(!(maximized || fullscreen));
      } catch {
        // 如果查询失败，保守起见允许热区（你也可改为 false）
        if (!disposed) setHotzoneEnabled(true);
      }
    };

    refresh();

    // 监听尺寸变化：最大化/全屏切换通常会触发 resize
    let unlisten: null | (() => void) = null;
    (async () => {
      try {
        const off = await winRef.current!.onResized(() => {
          refresh();
        });
        unlisten = off;
      } catch {
        // 忽略监听失败
      }
    })();

    return () => {
      disposed = true;
      try {
        unlisten?.();
      } catch {
        // ignore
      }
    };
  }, [enabled]);

  // 只有在“实际启用热区”时才设置 touchAction
  useEffect(() => {
    if (!enabled || !hotzoneEnabled) return;

    const prevTouchAction = document.body.style.touchAction;
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.touchAction = prevTouchAction;
    };
  }, [enabled, hotzoneEnabled]);

  const handles = useMemo(() => {
    return [
      // edges
      {
        key: "n",
        dir: "North" as Direction,
        style: {
          top: 0,
          left: cornerSize,
          right: cornerSize,
          height: thickness,
          cursor: "n-resize",
        },
      },
      {
        key: "s",
        dir: "South" as Direction,
        style: {
          bottom: 0,
          left: cornerSize,
          right: cornerSize,
          height: thickness,
          cursor: "s-resize",
        },
      },
      {
        key: "w",
        dir: "West" as Direction,
        style: {
          left: 0,
          top: cornerSize,
          bottom: cornerSize,
          width: thickness,
          cursor: "w-resize",
        },
      },
      {
        key: "e",
        dir: "East" as Direction,
        style: {
          right: 0,
          top: cornerSize,
          bottom: cornerSize,
          width: thickness,
          cursor: "e-resize",
        },
      },

      // corners
      {
        key: "nw",
        dir: "NorthWest" as Direction,
        style: {
          left: 0,
          top: 0,
          width: cornerSize,
          height: cornerSize,
          cursor: "nwse-resize",
        },
      },
      {
        key: "ne",
        dir: "NorthEast" as Direction,
        style: {
          right: 0,
          top: 0,
          width: cornerSize,
          height: cornerSize,
          cursor: "nesw-resize",
        },
      },
      {
        key: "sw",
        dir: "SouthWest" as Direction,
        style: {
          left: 0,
          bottom: 0,
          width: cornerSize,
          height: cornerSize,
          cursor: "nesw-resize",
        },
      },
      {
        key: "se",
        dir: "SouthEast" as Direction,
        style: {
          right: 0,
          bottom: 0,
          width: cornerSize,
          height: cornerSize,
          cursor: "nwse-resize",
        },
      },
    ];
  }, [thickness, cornerSize]);

  if (!enabled || !hotzoneEnabled) return null;

  const baseStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    pointerEvents: "none", // root 不吃事件
    zIndex,
  };

  const handleBaseStyle: React.CSSProperties = {
    position: "fixed",
    background: "transparent",
    pointerEvents: "auto", // handle 吃事件
    zIndex,
    touchAction: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
  };

  const onPointerDown =
    (dir: Direction) => async (e: React.PointerEvent<HTMLDivElement>) => {
      // 只响应主键（鼠标左键）/触控
      if ("button" in e && typeof e.button === "number" && e.button !== 0) return;

      e.preventDefault();
      if (stopPropagation) e.stopPropagation();

      try {
        (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
      } catch {}

      try {
        await winRef.current!.startResizeDragging(dir as any);
      } catch (err) {
        console.error("[ResizeHotzones] startResizeDragging failed:", err);
      }
    };

  return (
    <div aria-hidden="true" style={baseStyle}>
      {handles.map((h) => (
        <div
          key={h.key}
          onPointerDown={onPointerDown(h.dir)}
          style={{
            ...handleBaseStyle,
            ...h.style,
          }}
          className="resize-hotzone"
        />
      ))}
    </div>
  );
};
