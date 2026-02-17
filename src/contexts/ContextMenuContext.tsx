// ContextMenuContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef } from "react";
import { MenuItem } from "@/types/contextMenu";
import { useDefaultMenuItems } from "@/hooks/useDefaultMenuItems";

interface ContextMenuContextType {
  items: MenuItem[];
  defaultItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  resetMenuItems: () => void;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number }) => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

export const ContextMenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const defaultMenuItems = useDefaultMenuItems();
  const [items, setItems] = useState<MenuItem[]>(defaultMenuItems);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // 跟踪是否使用了自定义菜单项
  const isUsingCustomItems = useRef(false);

  // 当默认菜单项变化时，如果没有使用自定义菜单，则更新显示的菜单项
  useEffect(() => {
    if (!isUsingCustomItems.current) {
      setItems(defaultMenuItems);
    }
  }, [defaultMenuItems]);

  // 设置自定义菜单项
  const setMenuItems = useCallback((newItems: MenuItem[]) => {
    isUsingCustomItems.current = true;
    setItems(newItems);
  }, []);

  // 重置为默认菜单项
  const resetMenuItems = useCallback(() => {
    isUsingCustomItems.current = false;
    setItems(defaultMenuItems);
  }, [defaultMenuItems]);

  return (
    <ContextMenuContext.Provider
      value={{
        items,
        defaultItems: defaultMenuItems,
        setMenuItems,
        resetMenuItems,
        visible,
        setVisible,
        position,
        setPosition,
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  );
};

export const useContextMenuContext = () => {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenuContext must be used within a ContextMenuProvider');
  }
  return context;
};
