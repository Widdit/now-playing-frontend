import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

/**
 * 提前50ms图标 - 基于RotateCw（顺时针）
 * 箭头向前转动，表示时间提前
 */
export const Advance50Icon: React.FC<IconProps> = ({
                                                     size = 24,
                                                     color = 'currentColor',
                                                     strokeWidth = 2,
                                                     className,
                                                   }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* RotateCw 基础路径 */}
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    {/* 中间数字 50 */}
    <text
      x="12"
      y="15"
      textAnchor="middle"
      fontSize="6.5"
      fontWeight="700"
      fontFamily="system-ui, -apple-system, sans-serif"
      fill={color}
      stroke="none"
    >
      50
    </text>
  </svg>
);

/**
 * 延后50ms图标 - 基于RotateCcw（逆时针）
 * 箭头向后转动，表示时间延后
 */
export const Delay50Icon: React.FC<IconProps> = ({
                                                   size = 24,
                                                   color = 'currentColor',
                                                   strokeWidth = 2,
                                                   className,
                                                 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* RotateCcw 基础路径 */}
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    {/* 中间数字 50 */}
    <text
      x="12"
      y="15"
      textAnchor="middle"
      fontSize="6.5"
      fontWeight="700"
      fontFamily="system-ui, -apple-system, sans-serif"
      fill={color}
      stroke="none"
    >
      50
    </text>
  </svg>
);

/**
 * 重置为0ms图标
 * 设计理念：圆形表盘 + 中心归零点 + 四向归位指示
 */
export const Reset0Icon: React.FC<IconProps> = ({
                                                       size = 24,
                                                       color = 'currentColor',
                                                       strokeWidth = 2,
                                                       className,
                                                     }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* 外圆 - 表示时间轴 */}
    <circle cx="12" cy="12" r="9" />
    {/* 四个方向的归位短线 */}
    <line x1="12" y1="3" x2="12" y2="5.5" />
    <line x1="12" y1="18.5" x2="12" y2="21" />
    <line x1="3" y1="12" x2="5.5" y2="12" />
    <line x1="18.5" y1="12" x2="21" y2="12" />
    {/* 中心归零点 */}
    <circle cx="12" cy="12" r="2" fill={color} stroke="none" />
  </svg>
);
