import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Outlet } from "react-router-dom";
import "../index.css";

import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col bg-[#F5FFF5] min-w-0">
        <Header onMenuClick={() => setSidebarOpen((prev) => !prev)} />

        <OverlayScrollbarsComponent
          className="flex-1"
          options={{
            scrollbars: {
              theme: "os-theme-dark",
              autoHide: "scroll",
              autoHideDelay: 800,
            },
          }}
        >
          <main className="p-8 bg-[#F5FFF5] min-h-full">
            <Outlet />
          </main>
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
}