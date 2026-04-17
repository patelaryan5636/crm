import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

function MainLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F8F0]">

      {/* Sidebar */}
      <div className="w-[16%] min-w-[220px] max-w-[260px] h-full">
        <Sidebar />
      </div>

      {/* Right Section */}
      <div className="flex-1 flex flex-col">

        {/* Navbar */}
        <Navbar />

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </div>

      </div>

    </div>
  );
}

export default MainLayout;