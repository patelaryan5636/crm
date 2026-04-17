import { Bell, Search } from "lucide-react";

function Navbar() {
  return (
    <div className="h-[54px] bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">

      {/* LEFT */}
      <div className="flex items-center gap-4">

        {/* Search */}
        <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 w-[240px]">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>

      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-5">

        {/* Notifications */}
        <div className="relative cursor-pointer">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded-full">
            3
          </span>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-2 cursor-pointer">
          <img
            src="https://i.pravatar.cc/40"
            alt="user"
            className="w-8 h-8 rounded-full"
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-gray-800">
              Madhav
            </p>
            <p className="text-[11px] text-gray-500">
              Super Admin
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Navbar;