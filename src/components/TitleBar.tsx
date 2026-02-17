// TitleBar.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface TitleBarProps {
  /** 是否自动隐藏（只有鼠标靠近时才显示按钮） */
  autoHide?: boolean;
  /** 是否有背景 */
  hasBackground?: boolean;
  /** 标题文字 */
  title?: string;
  /** 图标路径（支持 .ico 或其他图片格式） */
  icon?: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({
                                                    autoHide = false,
                                                    hasBackground = false,
                                                    title,
                                                    icon,
                                                  }) => {
  const [buttonsVisible, setButtonsVisible] = useState(!autoHide);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNarrowWindow, setIsNarrowWindow] = useState(false);
  const longPressRef = useRef(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 检查全屏、最大化和窄窗口状态
  useEffect(() => {
    const checkFullscreen = async () => {
      try {
        const win = getCurrentWindow();
        const isFs = await win.isFullscreen();
        setIsFullscreen(isFs);
      } catch (error) {
        console.error("Failed to check fullscreen state:", error);
      }
    };

    const checkMaximized = async () => {
      try {
        const win = getCurrentWindow();
        const isMax = await win.isMaximized();
        setIsMaximized(isMax);
      } catch (error) {
        console.error("Failed to check maximized state:", error);
      }
    };

    const checkNarrowWindow = () => {
      setIsNarrowWindow(window.innerWidth < 768);
    };

    // 初始检查
    checkFullscreen();
    checkMaximized();
    checkNarrowWindow();

    // 监听窗口大小变化
    const handleResize = () => {
      checkNarrowWindow();
      checkFullscreen();
      checkMaximized();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleMouseDown = useCallback((buttonType: string) => {
    longPressRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      longPressRef.current = true;
    }, 300); // 300ms 后认为是长按
    setPressedButton(buttonType);
  }, []);

  const handleMouseUp = useCallback(async (buttonType: string) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setPressedButton(null);

    // 长按不触发事件
    if (longPressRef.current) {
      return;
    }

    try {
      const appWindow = getCurrentWindow();

      switch (buttonType) {
        case "minimize":
          await appWindow.minimize();
          break;
        case "maximize":
          if (await appWindow.isMaximized()) {
            await appWindow.unmaximize();
            await appWindow.center();
          } else {
            await appWindow.maximize();
          }
          break;
        case "close":
          await appWindow.destroy();
          break;
      }
    } catch (error) {
      console.error("Window operation failed:", error);
    }
  }, []);

  const handleButtonsAreaEnter = useCallback(() => {
    if (autoHide) {
      setButtonsVisible(true);
    }
  }, [autoHide]);

  const handleButtonsAreaLeave = useCallback(() => {
    if (autoHide) {
      setButtonsVisible(false);
    }
    setHoveredButton(null);
    setPressedButton(null);
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, [autoHide]);

  const shouldHasBackground = hasBackground || !!title;

  // 获取按钮背景色
  const getButtonBackground = (
    buttonType: string,
    baseColor: string,
    hoverOpacity: number,
    pressedOpacity: number
  ) => {
    if (pressedButton === buttonType) {
      return baseColor.replace(/[\d.]+\)$/, `${pressedOpacity})`);
    }
    if (hoveredButton === buttonType) {
      return baseColor.replace(/[\d.]+\)$/, `${hoverOpacity})`);
    }
    return "transparent";
  };

  // 全屏或窄窗口状态下不显示标题栏
  if (isFullscreen || isNarrowWindow) {
    return null;
  }

  return (
    <div
      data-tauri-drag-region
      className="fixed top-0 left-0 md:left-72 right-0 z-10 flex items-center justify-between select-none"
      style={{
        height: "32px",
        backgroundColor: shouldHasBackground
          ? "#121212"
          : "transparent",
      }}
    >
      {/* 左侧：图标和标题 */}
      <div className="flex items-center h-full px-3" data-tauri-drag-region>
        {icon && (
          <img
            src={icon}
            className="w-4 h-4 mr-2 pointer-events-none"
            draggable={false}
          />
        )}
        {title && (
          <span className="text-white text-xs pointer-events-none">
            {title}
          </span>
        )}
      </div>

      {/* 右侧：窗口控制按钮区域 */}
      <div
        className="flex h-full"
        onMouseEnter={handleButtonsAreaEnter}
        onMouseLeave={handleButtonsAreaLeave}
        style={{
          opacity: buttonsVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        {/* 最小化按钮 */}
        <button
          className="h-full flex items-center justify-center outline-none border-none cursor-default"
          style={{
            width: "46px",
            backgroundColor: getButtonBackground(
              "minimize",
              "rgba(255, 255, 255, 0.07)",
              0.07,
              0.12
            ),
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={() => setHoveredButton("minimize")}
          onMouseLeave={() => setHoveredButton(null)}
          onMouseDown={() => handleMouseDown("minimize")}
          onMouseUp={() => handleMouseUp("minimize")}
          tabIndex={-1}
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="none">
            <path d="M0 0.5H10" stroke="white" strokeWidth="1" />
          </svg>
        </button>

        {/* 最大化按钮 */}
        <button
          className="h-full flex items-center justify-center outline-none border-none cursor-default"
          style={{
            width: "46px",
            backgroundColor: getButtonBackground(
              "maximize",
              "rgba(255, 255, 255, 0.07)",
              0.07,
              0.12
            ),
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={() => setHoveredButton("maximize")}
          onMouseLeave={() => setHoveredButton(null)}
          onMouseDown={() => handleMouseDown("maximize")}
          onMouseUp={() => handleMouseUp("maximize")}
          tabIndex={-1}
        >
          {isMaximized ? (
            /* 还原图标：两个重叠的方形 */
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              {/* 前景方形（左下） */}
              <rect
                x="0.5"
                y="2.5"
                width="7"
                height="7"
                stroke="white"
                strokeWidth="1"
                fill="none"
              />
              {/* 背景方形的可见部分（右上角的 L 形） */}
              <path
                d="M2.5 2.5V0.5H9.5V7.5H7.5"
                stroke="white"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          ) : (
            /* 最大化图标：单个方形 */
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect
                x="0.5"
                y="0.5"
                width="9"
                height="9"
                stroke="white"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          )}
        </button>

        {/* 关闭按钮 */}
        <button
          className="h-full flex items-center justify-center outline-none border-none cursor-default"
          style={{
            width: "46px",
            backgroundColor:
              pressedButton === "close"
                ? "rgba(196, 43, 28, 1)"
                : hoveredButton === "close"
                  ? "rgba(196, 43, 28, 0.9)"
                  : "transparent",
            transition: "background-color 0.15s ease",
            marginRight: isMaximized ? "0" : "2px",
          }}
          onMouseEnter={() => setHoveredButton("close")}
          onMouseLeave={() => setHoveredButton(null)}
          onMouseDown={() => handleMouseDown("close")}
          onMouseUp={() => handleMouseUp("close")}
          tabIndex={-1}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M0 0L10 10M10 0L0 10" stroke="white" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
