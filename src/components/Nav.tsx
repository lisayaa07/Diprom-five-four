import { Printer } from "lucide-react";
import SearchBox from "./Search_Box";

function Nav() {
  return (
    <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-40">
      
      {/* LEFT LOGO */}
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
          <Printer className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg text-slate-800 leading-none">
            Five-Four
          </h1>
          <p className="text-[10px] text-slate-400 font-bold">
            โรงพิมพ์แม่สอด
          </p>
        </div>
      </div>

      {/* RIGHT SEARCH */}
      <SearchBox />

    </nav>
  );
}

export default Nav;
