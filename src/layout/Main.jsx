import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import { Outlet } from "react-router-dom";
import "../index.css";

import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

export default function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col bg-[#F5FFF5]">
        <Header />

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
