// GlobalContextMenu.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useContextMenuContext } from "@/contexts/ContextMenuContext";
import { MenuItem } from "@/types/contextMenu";
import { Listbox, ListboxItem } from "@heroui/listbox";
import { motion, AnimatePresence, Variants } from "framer-motion";

// 右箭头图标（用于表示有子菜单）
const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// 菜单容器样式组件
const MenuWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-full min-w-[180px] max-w-[260px] border-small px-1 py-2 rounded-medium border-default-200 dark:border-default-100 bg-content1 shadow-lg">
    {children}
  </div>
);

// 动画变体配置
const menuVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    x: -4,
    y: -4,
  },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 30,
      duration: 0.15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    x: 4,
    y: 4,
    transition: {
      duration: 0.1,
      ease: "easeOut" as const,
    },
  },
};

// 子菜单动画变体
const subMenuVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    x: -6,
  },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 30,
      duration: 0.12,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    x: -6, // 向左消失，避免向右闪现
    transition: {
      duration: 0.08,
      ease: "easeOut" as const,
    },
  },
};

// 子菜单组件
interface SubMenuProps {
  items: MenuItem[];
  parentRef: React.RefObject<HTMLDivElement | null>;
  itemRect: DOMRect | null;
  onClose: () => void;
  level: number;
  isParentClosing: boolean;
}

const SubMenu: React.FC<SubMenuProps> = ({ items, parentRef, itemRect, onClose, level, isParentClosing }) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [subItemRect, setSubItemRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const hoveredItem = items.find(item => item.key === hoveredKey);
  const hasChildren = hoveredItem?.children && hoveredItem.children.length > 0;

  // 确保在客户端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  // 父级触发关闭时，先关闭本级的子菜单（保证递归子菜单有 exit 动画）
  useEffect(() => {
    if (isParentClosing) {
      setHoveredKey(null);
      setSubItemRect(null);
    }
  }, [isParentClosing]);

  // 计算子菜单位置
  const getPosition = useCallback(() => {
    if (!parentRef.current || !itemRect) return { top: 0, left: 0 };

    const parentRect = parentRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 默认显示在右边
    let left = parentRect.right + 4;
    let top = itemRect.top - 8; // 对齐到触发项

    // 如果右边空间不够，显示在左边
    if (left + 200 > viewportWidth) {
      left = parentRect.left - 200 - 4;
    }

    // 确保不超出底部
    if (top + 200 > viewportHeight) {
      top = viewportHeight - 200 - 8;
    }

    // 确保不超出顶部
    if (top < 8) {
      top = 8;
    }

    return { top, left };
  }, [parentRef, itemRect]);

  const position = getPosition();

  const handleItemClick = useCallback((item: MenuItem) => {
    if (item.disabled) return;
    if (item.children && item.children.length > 0) return;

    item.onClick?.();
    onClose();
  }, [onClose]);

  const handleMouseEnter = useCallback((key: string, element: HTMLDivElement | null) => {
    setHoveredKey(key);
    if (element) {
      setSubItemRect(element.getBoundingClientRect());
    }
  }, []);

  // 使用 Portal 渲染子菜单，避免受父元素 transform 影响
  if (!mounted) return null;

  const menuContent = (
    <motion.div
      ref={menuRef}
      data-submenu="true"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={subMenuVariants}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 10000 + level,
        transformOrigin: 'left top',
      }}
    >
      <MenuWrapper>
        <Listbox
          aria-label={`Submenu level ${level}`}
          items={items}
          variant="flat"
        >
          {(item) => (
            <ListboxItem
              key={item.key}
              className={`${item.className || ''} ${item.children?.length ? 'pr-2' : ''}`}
              color={item.color || "default"}
              isDisabled={item.disabled}
              startContent={item.startContent}
              endContent={
                item.children?.length ? (
                  <ChevronRightIcon className="text-default-400" />
                ) : (
                  item.endContent
                )
              }
              onPress={() => handleItemClick(item)}
              showDivider={item.showDivider}
            >
              <div
                ref={(el) => {
                  if (el) itemRefs.current.set(item.key, el);
                }}
                className="w-full"
                onMouseEnter={(e) => handleMouseEnter(item.key, e.currentTarget)}
              >
                {item.label}
              </div>
            </ListboxItem>
          )}
        </Listbox>
      </MenuWrapper>

      {/* 递归渲染子菜单 */}
      <AnimatePresence>
        {hasChildren && hoveredKey && (
          <SubMenu
            items={hoveredItem!.children!}
            parentRef={menuRef}
            itemRect={subItemRect}
            onClose={onClose}
            level={level + 1}
            isParentClosing={isParentClosing}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );

  return createPortal(menuContent, document.body);
};

// 主菜单组件
export const GlobalContextMenu: React.FC = () => {
  const { items, visible, setVisible, position, setPosition } = useContextMenuContext();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [hoveredItemRect, setHoveredItemRect] = useState<DOMRect | null>(null);
  const [menuKey, setMenuKey] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const hoverClearTimeoutRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const hoveredItem = items.find(item => item.key === hoveredKey);
  const hasChildren = hoveredItem?.children && hoveredItem.children.length > 0;

  const clearCloseTimer = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const clearHoverClearTimer = useCallback(() => {
    if (hoverClearTimeoutRef.current !== null) {
      window.clearTimeout(hoverClearTimeoutRef.current);
      hoverClearTimeoutRef.current = null;
    }
  }, []);

  const closeMenu = useCallback((immediate: boolean = false) => {
    clearCloseTimer();
    clearHoverClearTimer();

    if (immediate || !hoveredKey) {
      setIsClosing(false);
      setVisible(false);
      setHoveredKey(null);
      setHoveredItemRect(null);
      return;
    }

    // 先让子菜单递归关闭（保证每一层都有 exit 动画），再关闭主菜单
    setIsClosing(true);

    // 先让 SubMenu 组件至少渲染一帧拿到 isParentClosing，从而触发其内部 hoveredKey 清空
    hoverClearTimeoutRef.current = window.setTimeout(() => {
      setHoveredKey(null);
      setHoveredItemRect(null);
    }, 20);

    // 等子菜单 exit 完成后，再让主菜单退出
    closeTimeoutRef.current = window.setTimeout(() => {
      setVisible(false);
      setIsClosing(false);
    }, 140);
  }, [clearCloseTimer, clearHoverClearTimer, hoveredKey, setVisible]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
      clearHoverClearTimer();
    };
  }, [clearCloseTimer, clearHoverClearTimer]);

  // 处理右键事件
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();

      if (items.length > 0) {
        clearCloseTimer();
        clearHoverClearTimer();
        setIsClosing(false);

        // 计算位置，确保菜单不超出视口
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const menuWidth = 200;
        const menuHeight = items.length * 40 + 16;

        let x = event.clientX;
        let y = event.clientY;

        if (x + menuWidth > viewportWidth) {
          x = viewportWidth - menuWidth - 8;
        }

        if (y + menuHeight > viewportHeight) {
          y = viewportHeight - menuHeight - 8;
        }

        // 关键：每次右键都生成一个新的 menuKey，这样旧菜单会在原地 exit，新菜单在新位置 enter
        setMenuKey((prev) => prev + 1);

        setPosition({ x, y });
        setVisible(true);
        setHoveredKey(null);
        setHoveredItemRect(null);
      }
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;

      // 检查是否点击在菜单或子菜单上（避免因为 root ref 在多实例退出/进入时被旧实例清空）
      const clickedOnAnyMenuRoot = target?.closest('[data-context-menu-root="true"]');
      const clickedOnSubmenu = target?.closest('[data-submenu]');

      if (!clickedOnAnyMenuRoot && !clickedOnSubmenu) {
        closeMenu(false);
        return;
      }

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // 检查是否点击在子菜单上
        const clickedOnSubmenu = (event.target as Element)?.closest('[data-submenu]');
        if (!clickedOnSubmenu) {
          closeMenu(false);
          setHoveredKey(null);
        }
      }
    };

    const handleScroll = () => {
      closeMenu(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu(false);
      }
    };

    const handleWindowBlur = () => {
      closeMenu(false);
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [items, setPosition, setVisible, clearCloseTimer, clearHoverClearTimer, closeMenu]);

  const handleItemClick = useCallback((item: MenuItem) => {
    if (item.disabled) return;
    if (item.children && item.children.length > 0) return;

    item.onClick?.();
    closeMenu(true);
  }, [closeMenu]);

  const handleMouseEnter = useCallback((key: string, element: HTMLDivElement | null) => {
    setHoveredKey(key);
    if (element) {
      setHoveredItemRect(element.getBoundingClientRect());
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    // 延迟关闭子菜单，以便用户有时间移动到子菜单
    setTimeout(() => {
      // 可以添加更复杂的逻辑来检测鼠标是否移动到了子菜单
    }, 100);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={menuKey}
          ref={(node) => {
            const currentNode = menuRef.current;
            const currentKey = currentNode?.dataset?.menuKey;

            if (node) {
              menuRef.current = node;
            } else {
              // 只有当正在卸载的实例就是当前 ref 指向的实例时，才清空 ref
              if (currentKey === String(menuKey)) {
                menuRef.current = null;
              }
            }
          }}
          data-context-menu-root="true"
          data-menu-key={menuKey}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={menuVariants}
          style={{
            position: 'fixed',
            top: position.y,
            left: position.x,
            zIndex: 9999,
            transformOrigin: 'left top',
          }}
        >
          <MenuWrapper>
            <Listbox
              aria-label="Context Menu"
              items={items}
              variant="flat"
            >
              {(item) => (
                <ListboxItem
                  key={item.key}
                  className={`${item.className || ''} ${item.children?.length ? 'pr-2' : ''} font-poppins`}
                  color={item.color || "default"}
                  isDisabled={item.disabled}
                  startContent={item.startContent}
                  endContent={
                    item.children?.length ? (
                      <ChevronRightIcon className="text-default-400" />
                    ) : (
                      item.endContent
                    )
                  }
                  onPress={() => handleItemClick(item)}
                  showDivider={item.showDivider}
                >
                  <div
                    ref={(el) => {
                      if (el) itemRefs.current.set(item.key, el);
                    }}
                    className="w-full"
                    onMouseEnter={(e) => handleMouseEnter(item.key, e.currentTarget)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {item.label}
                  </div>
                </ListboxItem>
              )}
            </Listbox>
          </MenuWrapper>

          {/* 子菜单 */}
          <AnimatePresence>
            {hasChildren && hoveredKey && (
              <SubMenu
                items={hoveredItem!.children!}
                parentRef={menuRef}
                itemRect={hoveredItemRect}
                onClose={() => {
                  closeMenu(false);
                }}
                level={1}
                isParentClosing={isClosing}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
