// contextMenu.ts
import { ReactNode } from "react";

export interface MenuItem {
  key: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  startContent?: ReactNode;
  endContent?: ReactNode;
  children?: MenuItem[]; // 子菜单项
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  showDivider?: boolean; // 是否在此项后显示分隔线
}
