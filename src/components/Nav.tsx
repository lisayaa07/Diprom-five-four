import {
  Printer,
  LayoutDashboard,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login", { replace: true });
  };

  const isActive = (path: string) =>
    location.pathname === path
      ? "bg-indigo-100 text-indigo-700"
      : "text-slate-600 hover:bg-slate-100";

  return (
    <>
      {/* 🔹 MOBILE TOP BAR (มีแค่ 3 ขีด) */}
      <div className="lg:hidden fixed top-0 left-0 w-full h-14 bg-white border-b border-slate-200 flex items-center px-4 z-50">
        <button onClick={() => setOpen(true)}>
          <Menu className="w-6 h-6 text-slate-700" />
        </button>
      </div>

      {/* 🔹 OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 🔹 SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-200
          flex flex-col p-6 z-50 transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* CLOSE BUTTON (mobile only) */}
        <div className="flex justify-between items-center mb-8 lg:hidden">
          <span className="font-semibold text-slate-800">เมนู</span>
          <button onClick={() => setOpen(false)}>
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* LOGO */}
        <div
          className="flex items-center gap-3 cursor-pointer mb-10"
          onClick={() => {
            navigate("/form");
            setOpen(false);
          }}
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

        {/* MENU */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              navigate("/form");
              setOpen(false);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive(
              "/form"
            )}`}
          >
            <FileText size={16} />
            ฟอร์ม
          </button>

          {role === "SuperAdmin" && (
            <button
              onClick={() => {
                navigate("/super-admin");
                setOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive(
                "/super-admin"
              )}`}
            >
              <LayoutDashboard size={16} />
              จัดการระบบ
            </button>
          )}
        </div>

        {/* LOGOUT */}
        <div className="mt-auto pt-6 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50"
          >
            <LogOut size={16} />
            ออกจากระบบ
          </button>

          <div className="mt-2 text-xs text-slate-400 text-center">
            Role: {role}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Nav;