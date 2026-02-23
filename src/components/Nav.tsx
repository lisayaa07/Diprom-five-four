import { Printer } from "lucide-react";
import SearchBox from "./Search_Box";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Nav() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // ✅ อ่านจาก localStorage ตรง ๆ
  const role = localStorage.getItem("role");

  return (
    <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-40">

      {/* LEFT */}
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => navigate("/form")}
      >
        <div className="bg-indigo-600 p-2 rounded-xl">
          <Printer className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg text-slate-800">Five-Four</h1>
          <p className="text-[10px] text-slate-400 font-bold">
            โรงพิมพ์แม่สอด
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SearchBox />

        {role === "SuperAdmin" && (
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm"
            >
              จัดการ ▾
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg">
                <button
                  onClick={() => {
                    navigate("/form");
                    setOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
                >
                  ไปหน้าฟอร์ม
                </button>

                <button
                  onClick={() => {
                    navigate("/super-admin");
                    setOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
                >
                  จัดการระบบ
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Nav;