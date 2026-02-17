import { useEffect, useRef, useState } from "react";

/**
 * 当用户 5 秒没有移动鼠标且没有点击鼠标时隐藏光标；
 * 一旦移动/点击/滚轮/触摸，就立刻显示光标并重置计时。
 */
export function AutoHideCursor({
                                 idleMs = 5000,
                                 target = "body", // "body" 表示全局隐藏；也可以传 "#app" / ".container" / 自己的选择器
                               }: {
  idleMs?: number;
  target?: string;
}) {
  const [hidden, setHidden] = useState(false);

  const timerRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleHide = () => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      // 超过 idleMs 仍然没触发“显示”事件，就隐藏
      setHidden(true);
    }, idleMs);
  };

  const showAndReset = () => {
    // 只要用户有交互，就显示并重置计时
    if (hidden) setHidden(false);
    scheduleHide();
  };

  useEffect(() => {
    // 初次进入就开始计时
    scheduleHide();

    const onMouseMove = (e: MouseEvent) => {
      const last = lastPosRef.current;
      const current = { x: e.clientX, y: e.clientY };

      // 避免某些情况下抖动/重复触发：位置没变就不算“移动”
      if (last && last.x === current.x && last.y === current.y) return;

      lastPosRef.current = current;
      showAndReset();
    };

    const onMouseDown = () => showAndReset(); // 鼠标点击
    const onWheel = () => showAndReset(); // 滚轮交互
    const onTouchStart = () => showAndReset(); // 触摸设备

    // 用捕获阶段更稳（即使子元素 stopPropagation 也能捕捉到）
    window.addEventListener("mousemove", onMouseMove, { capture: true, passive: true });
    window.addEventListener("mousedown", onMouseDown, { capture: true });
    window.addEventListener("wheel", onWheel, { capture: true, passive: true });
    window.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });

    return () => {
      clearTimer();
      window.removeEventListener("mousemove", onMouseMove, { capture: true } as any);
      window.removeEventListener("mousedown", onMouseDown, { capture: true } as any);
      window.removeEventListener("wheel", onWheel, { capture: true } as any);
      window.removeEventListener("touchstart", onTouchStart, { capture: true } as any);
    };
  }, [idleMs, hidden]);

  useEffect(() => {
    const el =
      target === "body"
        ? document.body
        : (document.querySelector(target) as HTMLElement | null);

    if (!el) return;

    const prevCursor = el.style.cursor;

    if (hidden) {
      el.style.cursor = "none";
    } else {
      el.style.cursor = prevCursor || "";
    }

    return () => {
      // 卸载时恢复
      el.style.cursor = prevCursor || "";
    };
  }, [hidden, target]);

  return null; // 这是一个“行为组件”，不渲染任何 UI
}
