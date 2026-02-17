"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type RefreshCwProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: number;
  isHovered?: boolean;
  isSpinning?: boolean;
  onSpinComplete?: () => void;
};

// 弹簧动画配置
const springTransition = { type: "spring" as const, stiffness: 150, damping: 25 };

function RefreshCw({
                     size = 24,
                     className,
                     isHovered,
                     isSpinning,
                     onSpinComplete,
                     ...props
                   }: RefreshCwProps) {
  const controls = useAnimation();
  const isSpinningRef = useRef(false);
  const isHoveredRef = useRef(isHovered);

  // 记录基础角度，用于在动画被打断或状态切换时保持连续性
  const baseRotation = useRef(0);

  // 同步 Hover 状态引用
  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  // 1. 响应 Hover 状态变化
  useEffect(() => {
    // 旋转动画优先级最高，旋转过程中忽略 Hover 变化
    if (isHovered === undefined || isSpinningRef.current) return;

    const targetRotation = isHovered ? 45 : 0;
    baseRotation.current = targetRotation;

    controls.start({
      rotate: targetRotation,
      transition: springTransition,
    });
  }, [isHovered, controls]);

  // 2. 响应 Spin 状态变化（点击触发）
  useEffect(() => {
    if (isSpinning === undefined) return;

    const handleSpin = async () => {
      // 防止重复触发
      if (isSpinning && !isSpinningRef.current) {
        isSpinningRef.current = true;

        // 获取当前基础角度 (0 或 45)
        const startRotation = baseRotation.current;
        // 目标是转一整圈
        const endRotation = startRotation + 360;

        // 执行旋转动画
        await controls.start({
          rotate: endRotation,
          transition: { duration: 0.5, ease: "easeInOut" },
        });

        // 动画结束后的状态对齐
        if (isHoveredRef.current) {
          // 情况 A: 鼠标仍悬停
          // 当前角度 endRotation (如 405°) 与 visual 45° 视觉一致
          // 直接重置数值，防止多次点击导致角度值无限增大
          controls.set({ rotate: 45 });
          baseRotation.current = 45;
        } else {
          // 情况 B: 鼠标已移出
          // 当前角度 endRotation (如 405°) 需回到 visual 0°
          // 计算最近的 visual 0° (即 360°)，执行平滑回弹
          await controls.start({
            rotate: endRotation - startRotation,
            transition: springTransition,
          });

          // 补间动画完成后，静默重置归零
          controls.set({ rotate: 0 });
          baseRotation.current = 0;
        }

        isSpinningRef.current = false;
        onSpinComplete?.();
      }
    };

    handleSpin();
  }, [isSpinning, controls, onSpinComplete]);

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer select-none",
        className,
      )}
      {...props}
    >
      <motion.svg
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.g animate={controls} initial={{ rotate: 0 }}>
          <motion.path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <motion.path d="M21 3v5h-5" />
          <motion.path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <motion.path d="M8 16H3v5" />
        </motion.g>
      </motion.svg>
    </div>
  );
}

export {
  RefreshCw,
  RefreshCw as RefreshCwIcon,
  type RefreshCwProps,
  type RefreshCwProps as RefreshCwIconProps,
};
