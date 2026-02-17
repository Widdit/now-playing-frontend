// Widget.tsx
import React, { useEffect } from "react";

export default function WidgetPage() {
  // 组件强制背景透明
  useEffect(() => {
    document.documentElement.classList.add("widget-transparent");
    return () => document.documentElement.classList.remove("widget-transparent");
  }, []);

  return (
    <iframe
      src="http://localhost:9863/widget"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: "100%",
        height: "100%",
        border: "none",
        zIndex: 99,
        backgroundColor: "transparent",
        colorScheme: "normal",
      }}
    />
  );
}
