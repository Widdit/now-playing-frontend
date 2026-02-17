// useCustomContextMenu.ts
import { useEffect, useMemo } from "react";
import { useContextMenuContext } from "@/contexts/ContextMenuContext";
import { MenuItem } from "@/types/contextMenu";

interface UseCustomContextMenuOptions {
  /**
   * 是否合并默认菜单项
   * @default false
   */
  mergeWithDefault?: boolean;
  /**
   * 如果合并，自定义菜单项放在前面还是后面
   * @default 'before'
   */
  position?: 'before' | 'after';
}

export const useCustomContextMenu = (
  customItems: MenuItem[],
  options: UseCustomContextMenuOptions = {}
) => {
  const { setMenuItems, resetMenuItems, defaultItems } = useContextMenuContext();
  const { mergeWithDefault = false, position = 'before' } = options;

  const finalItems = useMemo(() => {
    if (!mergeWithDefault) {
      return customItems;
    }
    return position === 'before'
      ? [...customItems, ...defaultItems]
      : [...defaultItems, ...customItems];
  }, [customItems, mergeWithDefault, position, defaultItems]);

  useEffect(() => {
    setMenuItems(finalItems);

    return () => {
      resetMenuItems();
    };
  }, [finalItems, setMenuItems, resetMenuItems]);

  return {
    updateMenuItems: setMenuItems,
    resetMenuItems,
  };
};
