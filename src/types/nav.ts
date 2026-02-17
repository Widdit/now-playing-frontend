// nav.ts
import type React from "react";

export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  position?: "top" | "bottom";
  external?: boolean;
  endContent?: React.ReactNode;
}
