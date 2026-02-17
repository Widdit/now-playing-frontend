"use client";

import {
  createContext,
  useContext,
  useEffect,
  type HTMLAttributes,
  type ComponentType,
} from "react";
import { useAnimation } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

type AnimationControls = ReturnType<typeof useAnimation>;

// --- 1. 工具函数 ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- 2. 类型定义 ---
type IconComponentProps = {
  size?: number;
  // 如果你的图标组件还有其他通用属性，可以在这里添加
};

type IconComponentType = ComponentType<IconComponentProps>;

export type IconProps<T extends string = string> = HTMLAttributes<HTMLDivElement> & {
  size?: number;
  animation?: T;
  trigger?: "hover" | "click" | "none";
  isHovered?: boolean;
};

// --- 3. Context 定义 ---
// 用于在 IconWrapper 和具体的 IconComponent 之间传递动画控制器和当前选中的动画名称
type IconContextType = {
  controls: AnimationControls;
  animation: string;
};

const IconContext = createContext<IconContextType | undefined>(undefined);

export const useAnimateIconContext = () => {
  const context = useContext(IconContext);

  if (!context) {
    throw new Error("useAnimateIconContext must be used within an IconWrapper");
  }

  return context;
};

// --- 4. getVariants 辅助函数 ---
// 用于在组件内部根据 context 中当前的 animation 名称获取对应的 variants
export const getVariants = (animations: Record<string, any>) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { animation } = useAnimateIconContext();

  return animations[animation] || animations["default"] || {};
};

// --- 5. IconWrapper 组件 ---
// 这是最核心的部分，负责处理鼠标事件并控制动画播放
export const IconWrapper = <T extends string>({
  icon: Icon,
  animation = "default" as T,
  trigger = "hover",
  className,
  size = 24,
  isHovered,
  ...props
}: IconProps<T> & { icon: IconComponentType }) => {
  const controls = useAnimation();

  // 处理 Hover 事件
  const handleMouseEnter = async () => {
    if (trigger === "hover") {
      await controls.start("animate");
    }
  };

  const handleMouseLeave = async () => {
    if (trigger === "hover") {
      await controls.start("normal");
    }
  };

  // 处理 Click 事件
  const handleClick = async () => {
    if (trigger === "click") {
      await controls.start("animate");
    }
  };

  // 监听外部传入的 isHovered 变化
  useEffect(() => {
    // 如果没有传入 isHovered 属性，就不执行下面的逻辑，保持原有自触发逻辑
    if (isHovered === undefined) return;

    if (isHovered) {
      controls.start("animate");
    } else {
      controls.start("normal");
    }
  }, [isHovered, controls]);

  return (
    <IconContext.Provider value={{ controls, animation: animation as string }}>
      <div
        className={cn(
          "flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer select-none",
          className,
        )}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <Icon size={size} />
      </div>
    </IconContext.Provider>
  );
};
