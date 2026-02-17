import { Outlet } from "react-router-dom";

export default function BaseLayout() {
  return (
    <>
      <div className="antialiased min-h-screen">
        <div data-overlay-container="true">
          <div
            id="app-container"
            className="relative flex min-h-dvh flex-col"
          >
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
