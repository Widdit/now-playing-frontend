// App.tsx
import { Suspense, lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { TitleUpdater } from "./TitleUpdater";
import DefaultLayout from "@/layouts/DefaultLayout";
import BaseLayout from "@/layouts/BaseLayout";
import { ResizeHotzones } from "@/components/ResizeHotzones";
import { ContextMenuProvider } from "@/contexts/ContextMenuContext";
import { GlobalContextMenu } from "@/components/GlobalContextMenu";
import { useEnv } from "@/contexts/EnvContext";

const IndexPage = lazy(() => import("@/pages/Index"));
const AboutPage = lazy(() => import("@/pages/About"));
const DesktopSettingsPage = lazy(() => import("@/pages/SettingsDesktop"));
const CameraSettingsPage = lazy(() => import("@/pages/SettingsCamera"));
const OutputSettingsPage = lazy(() => import("@/pages/SettingsOutput"));
const SponsorPage = lazy(() => import("@/pages/Sponsor"));
const ExtensionPage = lazy(() => import("@/pages/Extension"));
const WindowExtensionPage = lazy(() => import("@/pages/ExtensionWindow"));
const NotFoundPage = lazy(() => import("@/pages/NotFound"));
const GeneralSettingsPage = lazy(() => import("@/pages/SettingsGeneral"));
const LyricSettingsPage = lazy(() => import("@/pages/SettingsLyric"));
const LyricPage = lazy(() => import("@/pages/Lyric"));
const PlayerPage = lazy(() => import("@/pages/Player"));
const ApiPage = lazy(() => import("@/pages/Api"));
const WidgetPage = lazy(() => import("@/pages/Widget"));
const PlayerSettingsPage = lazy(() => import("@/pages/SettingsPlayer"));
const MarkdownEditorPage = lazy(() => import("@/pages/MarkdownEditor"));
const PageDeploymentExtensionPage = lazy(() => import("@/pages/ExtensionPageDeployment"));

function App() {
  const { isDesktop } = useEnv();

  return (
    <ContextMenuProvider>
      {/* 网页标题 */}
      <TitleUpdater />

      {/* 桌面端：添加更易拖拽缩放的区域 */}
      {isDesktop && <ResizeHotzones thickness={6} cornerSize={10} />}

      {/* 右键菜单 */}
      <GlobalContextMenu />

      <Suspense fallback={null}>
        <Routes>
          <Route element={<BaseLayout />}>
            <Route element={<IndexPage />} path="/" />
            <Route element={<WidgetPage />} path="/widgetDesktop" />
            <Route element={<LyricPage />} path="/lyric" />
            <Route element={<LyricPage />} path="/lyric/:profileId" />
            <Route element={<PlayerPage />} path="/player" />
            <Route element={<MarkdownEditorPage />} path="/markdown/editor" />
          </Route>
          <Route element={<DefaultLayout />}>
            <Route
              element={<Navigate replace to="/settings/general" />}
              path="/settings"
            />
            <Route element={<GeneralSettingsPage />} path="/settings/general" />
            <Route element={<LyricSettingsPage />} path="/settings/lyric" />
            <Route element={<PlayerSettingsPage />} path="/settings/player" />
            <Route element={<DesktopSettingsPage />} path="/settings/desktop" />
            <Route element={<CameraSettingsPage />} path="/settings/camera" />
            <Route element={<OutputSettingsPage />} path="/settings/output" />
            <Route element={<ApiPage />} path="/apiPage" />
            <Route element={<ExtensionPage />} path="/extension" />
            <Route element={<WindowExtensionPage />} path="/extension/window" />
            <Route element={<PageDeploymentExtensionPage />} path="/extension/deployment" />
            <Route element={<SponsorPage />} path="/sponsor" />
            <Route element={<AboutPage />} path="/about" />
          </Route>
          <Route>
            <Route element={<NotFoundPage />} path="*" />
          </Route>
        </Routes>
      </Suspense>
    </ContextMenuProvider>
  );
}

export default App;
