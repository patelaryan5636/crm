import { Search, Bell } from "lucide-react";

function Navbar({ toggleSidebar }) {
  return (
    <div className="flex items-center justify-between w-full h-16">

      {/* Left / Center - Search */}
      <div className="flex items-center flex-1">
        <button onClick={toggleSidebar} className="md:hidden text-xl mr-4 text-gray-500">
          ☰
        </button>
        <div className="hidden md:flex items-center gap-2 text-gray-500 bg-gray-100/80 rounded-full px-4 py-1.5 focus-within:bg-gray-100 transition-colors">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search anywhere..."
            className="bg-transparent border-none text-sm text-gray-700 focus:outline-none w-64 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-6">
        <button className="text-gray-400 hover:text-gray-600 relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 bg-sky-100 text-sky-700 font-semibold rounded-full flex items-center justify-center text-sm">
            A
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">Admin</span>
        </div>
      </div>

    </div>
  );
}

export default Navbar;