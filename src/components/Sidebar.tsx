import { NavLink, Outlet } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "w-full flex items-center gap-3 rounded-xl border px-3 py-3 transition",
    "border-white/10 bg-white/5 hover:bg-white/10",
    isActive ? "bg-blue-500/20 border-blue-400/40" : ""
  ].join(" ");

export default function Sidebar() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-72 h-screen border-r border-white/10 bg-slate-900/40 backdrop-blur px-4 py-5">      

        <nav className="space-y-2">
          <NavLink to="/form" className={linkClass}>
           
            <span className="font-medium">ฟอร์ม</span>
          </NavLink>

          <NavLink to="/add" className={linkClass}>
           
            <span className="font-medium">เพิ่มงาน</span>
          </NavLink>

          <NavLink to="/calc" className={linkClass}>
           
            <span className="font-medium">คำนวณ</span>
          </NavLink>
        </nav>
      </aside>

 
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
