// Sidebar.tsx
import { useState, useCallback, memo } from "react";
import { useLocation, Link } from "react-router-dom";

import HamburgerButton from "./HamburgerButton";

import { siteConfig } from "@/constants/site";
import { NavItem } from "@/types/nav";
import { useOpenExternalUrl } from "@/hooks/useOpenExternalUrl";

const AppSidebarIcon = "/assets/now_playing_sidebar_icon.png";

const MobileNavbar = memo(
  ({
     isSidebarOpen,
     onToggleSidebar,
     onCloseSidebar,
   }: {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    onCloseSidebar: () => void;
  }) => (
    <div className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-divider flex items-center px-4 z-50 md:hidden">
      {/* 软件图标 */}
      <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
        <Link className="pointer-events-auto" to="/" onClick={onCloseSidebar}>
          <img className="h-6" src={AppSidebarIcon} />
        </Link>
      </div>

      {/* 右侧汉堡按钮 */}
      <div className="flex justify-end w-full">
        <HamburgerButton isActive={isSidebarOpen} onClick={onToggleSidebar} />
      </div>
    </div>
  ),
);

// 导航项组件
const NavContent: React.FC<{
  topNavItems: NavItem[];
  bottomNavItems: NavItem[];
  currentPath: string;
  onItemClick: () => void;
}> = ({ topNavItems, bottomNavItems, currentPath, onItemClick }) => {
  const { openExternalUrl } = useOpenExternalUrl();

  const renderNavItem = (item: NavItem) => {
    // 特殊处理 "扩展功能" 导航项：匹配自身及所有子路径
    const isExtensionActive =
      item.href === "/extension" && currentPath.startsWith("/extension");
    // 其余项保持精确匹配
    const isActive = isExtensionActive || currentPath === item.href;

    const handleClick = (e: React.MouseEvent) => {
      if (item.external) {
        e.preventDefault();
        openExternalUrl(item.href);
      }
      onItemClick();
    };

    return (
      <Link
        key={item.key}
        className={`group flex items-center gap-[0.55rem] relative py-1.5 w-full px-3 min-h-12 rounded-xl cursor-pointer transition-all duration-150
          ${
          isActive
            ? "bg-default-100 text-foreground"
            : "text-default-500 hover:bg-default/40 hover:text-default-foreground"
        }`}
        to={item.href}
        onClick={handleClick}
      >
        <div className="shrink-0">{item.icon}</div>
        <span className="flex-1 truncate text-base font-medium">
          {item.label}
        </span>
        {item.endContent && (
          <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {item.endContent}
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* 顶部导航项 */}
      <nav className="flex flex-col gap-0.5">
        {topNavItems.map(renderNavItem)}
      </nav>

      {/* 弹性空间 */}
      <div className="flex-grow" />

      {/* 底部导航项 */}
      <nav className="flex flex-col gap-0.5">
        {bottomNavItems.map(renderNavItem)}
      </nav>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 从 siteConfig 获取导航项
  const navItems: NavItem[] = siteConfig.sidebarNavItems;

  const topNavItems = navItems.filter((item) => item.position !== "bottom");
  const bottomNavItems = navItems.filter((item) => item.position === "bottom");

  // 关闭侧边栏
  const closeSidebar = () => setIsSidebarOpen(false);

  // 使用 useCallback 确保回调函数引用稳定
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  return (
    <>
      {/* 移动设备顶部导航栏 */}
      <MobileNavbar
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={closeSidebar}
        onToggleSidebar={toggleSidebar}
      />

      {/* 桌面端侧边栏（移动设备隐藏） */}
      <div className="hidden md:block h-full">
        <div className="h-full w-72 border-r border-divider p-6 flex flex-col">
          {/* 软件图标 */}
          <div className="flex flex-col relative top-4 items-center mb-14">
            <a href="/">
              <img className="h-6" src={AppSidebarIcon} />
            </a>
          </div>

          <NavContent
            bottomNavItems={bottomNavItems}
            currentPath={currentPath}
            topNavItems={topNavItems}
            onItemClick={closeSidebar}
          />
        </div>
      </div>

      {/* 移动设备侧边栏 */}
      <div
        className={`fixed top-16 left-0 right-0 bottom-0 z-40 bg-background transform transition-transform duration-300 ease-in-out md:hidden
          ${isSidebarOpen ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div className="h-full flex flex-col p-6">
          <NavContent
            bottomNavItems={bottomNavItems}
            currentPath={currentPath}
            topNavItems={topNavItems}
            onItemClick={closeSidebar}
          />
        </div>
      </div>

      {/* 侧边栏打开时的遮罩层 */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}
    </>
  );
};
