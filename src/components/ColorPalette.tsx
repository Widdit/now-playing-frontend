import React, { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Slider } from "@heroui/slider";

interface ColorPaletteProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

const PRESET_COLORS = [
  "#ffffff",
  "#40a4d8",
  "#33beb8",
  "#b2c225",
  "#fecc2f",
  "#f9a228",
  "#f6621f",
  "#db3838",
  "#ee657a",
  "#a363d9",
];

// 将 rgba 字符串解析为 hex 和 opacity
const parseRgba = (rgba: string): { hex: string; opacity: number } => {
  // 尝试解析 rgba 格式
  const rgbaMatch = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    return { hex, opacity: a };
  }

  // 如果是 hex 格式，直接返回
  if (rgba.startsWith("#")) {
    return { hex: rgba, opacity: 1 };
  }

  // 默认返回白色
  return { hex: "#ffffff", opacity: 1 };
};

// 将 hex 和 opacity 组合为 rgba 字符串
const toRgba = (hex: string, opacity: number): string => {
  let hexValue = hex.replace("#", "");
  if (hexValue.length === 3) {
    hexValue = hexValue.split("").map(c => c + c).join("");
  }
  const r = parseInt(hexValue.substring(0, 2), 16);
  const g = parseInt(hexValue.substring(2, 4), 16);
  const b = parseInt(hexValue.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// 生成透明度网格背景样式（模拟 Photoshop 透明背景）
const getTransparencyGridStyle = (opacity: number): React.CSSProperties => {
  const gridColor = "112, 112, 112";
  // 深色网格的不透明度随用户设置的不透明度变化
  // 当 opacity = 1 时，网格完全显示；当 opacity = 0 时，网格较淡
  const gridOpacity = 0.2 + 0.8 * opacity;
  return {
    backgroundImage: `
      linear-gradient(45deg, rgba(${gridColor}, ${gridOpacity}) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(${gridColor}, ${gridOpacity}) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(${gridColor}, ${gridOpacity}) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(${gridColor}, ${gridOpacity}) 75%)
    `,
    backgroundSize: "8px 8px",
    backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
    backgroundColor: "#c0c0c0",
  };
};

export const ColorPalette: React.FC<ColorPaletteProps> = ({ color, onChange, className }) => {
  const [hexColor, setHexColor] = useState(() => parseRgba(color).hex);
  const [opacity, setOpacity] = useState(() => parseRgba(color).opacity);
  const [inputValue, setInputValue] = useState(() => parseRgba(color).hex);

  // 当外部 color 变化时，同步更新内部状态
  useEffect(() => {
    const parsed = parseRgba(color);
    setHexColor(parsed.hex);
    setOpacity(parsed.opacity);
    setInputValue(parsed.hex);
  }, [color]);

  // 验证十六进制颜色格式（#RGB 或 #RRGGBB）
  const isValidHexColor = (value: string): boolean => {
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/i.test(value);
  };

  // 处理拾色器颜色变化
  const handleHexColorChange = (newHex: string) => {
    setHexColor(newHex);
    setInputValue(newHex);
    onChange(toRgba(newHex, opacity));
  };

  // 处理不透明度变化
  const handleOpacityChange = (newOpacity: number | number[]) => {
    const opacityValue = Array.isArray(newOpacity) ? newOpacity[0] : newOpacity;
    setOpacity(opacityValue);
    onChange(toRgba(hexColor, opacityValue));
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // 自动添加 # 前缀
    if (value && !value.startsWith("#")) {
      value = "#" + value;
    }

    setInputValue(value);

    // 如果是合法的颜色值，则同步更新
    if (isValidHexColor(value)) {
      setHexColor(value);
      onChange(toRgba(value, opacity));
    }
  };

  // 处理预设颜色点击
  const handlePresetClick = (presetColor: string) => {
    setHexColor(presetColor);
    setInputValue(presetColor);
    onChange(toRgba(presetColor, opacity));
  };

  return (
    <div className={`flex flex-wrap items-start gap-2 overflow-visible ${className ?? ""}`}>
      {PRESET_COLORS.map((presetColor) => {
        const isSelected = hexColor.toLowerCase() === presetColor.toLowerCase();

        return (
          <div
            key={presetColor}
            className="flex aspect-square h-[31px] w-[31px] cursor-pointer items-center justify-center rounded-md transition hover:scale-110 active:scale-100"
            style={{ backgroundColor: presetColor }}
            onClick={() => handlePresetClick(presetColor)}
          >
            {isSelected && (
              <p style={{ color: "white", filter: "drop-shadow(rgb(255, 255, 255) 0px 0px 5px)" }}>
                <img src="/assets/checkmark-38b076ff.svg" className="w-5" alt="checkmark" />
              </p>
            )}
          </div>
        );
      })}
      <Popover placement="right">
        <PopoverTrigger>
          <div
            className="relative flex aspect-square h-[31px] w-[31px] cursor-pointer items-center justify-center rounded-md transition hover:scale-110 aria-expanded:opacity-100"
            style={{
              backgroundColor: hexColor
            }}
          >
            <img
              src="/assets/color-picker-2b4da951.svg"
              className="pointer-events-none absolute z-40 h-5 w-5"
              alt="color-picker-icon"
              style={{ filter: "drop-shadow(rgb(0, 0, 0) 0px 0px 4px)" }}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-col px-2 py-3">
            <HexColorPicker color={hexColor} onChange={handleHexColorChange} />
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              maxLength={7}
              placeholder="#ffffff"
              className="mt-3 rounded-lg bg-default-200 py-2 text-center font-jetbrains text-sm text-white outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </PopoverContent>
      </Popover>
      <Popover placement="right">
        <PopoverTrigger>
          <div
            className="flex aspect-square h-[31px] w-[31px] cursor-pointer items-center justify-center rounded-md transition hover:scale-110 aria-expanded:opacity-100"
            style={getTransparencyGridStyle(opacity)}
          />
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-col px-2 py-3 font-poppins min-w-[200px]">
            <Slider
              className="max-w-full"
              color="foreground"
              size="sm"
              label="不透明度"
              aria-label="Opacity Slider"
              maxValue={1}
              minValue={0}
              step={0.01}
              formatOptions={{ style: "percent" }}
              value={opacity}
              onChange={handleOpacityChange}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
