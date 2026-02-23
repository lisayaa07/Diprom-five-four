import { Printer, LayoutDashboard, FileText, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");


    const handleLogout = () => {

    localStorage.removeItem("admin_token"); 

    navigate("/admin/login", { replace: true });
  };

  const isActive = (path: string) =>
    location.pathname === path
      ? "bg-indigo-100 text-indigo-700"
      : "text-slate-600 hover:bg-slate-100";

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col p-6">

      {/* LOGO */}
      <div
        className="flex items-center gap-3 cursor-pointer mb-10"
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

      {/* MENU */}
      <div className="flex flex-col gap-2">

        <button
          onClick={() => navigate("/form")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive("/form")}`}
        >
          <FileText size={16} />
          ฟอร์ม
        </button>

        {role === "SuperAdmin" && (
          <button
            onClick={() => navigate("/super-admin")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive("/super-admin")}`}
          >
            <LayoutDashboard size={16} />
            จัดการระบบ
          </button>
        )}
        

      </div>
      

      {/* 🔥 LOGOUT อยู่ล่างสุด */}
      <div className="mt-auto pt-6">
      
      <div className=" border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50"
        >
          <LogOut size={16} />
          ออกจากระบบ
        </button>
      </div>
        <div className="mt-2 mb-0 text-xs text-slate-400 text-center ">
        Role: {role}
      </div>
    
      
          
      </div>

    </aside>
  );
}

export default Nav;