// src/AdminLogin.tsx (หรือ src/pages/AdminLogin.tsx แล้วแต่โครงสร้างคุณ)
import  { useState, type FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setToken, getRole, isLoggedIn } from "./lib/Auth";
import axiosInstance from "./lib/axios";


export default function AdminLogin() {
  const nav = useNavigate();
  const [userName, setUserName] = useState("");
const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) return;
    const role = getRole();
    nav(role === "SuperAdmin" ? "/super-admin" : "/form", { replace: true });
  }, [nav]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setSubmitting(true);

      // ✅ await ต้องอยู่ใน async function
      const res = await axiosInstance.post("/auth/login", {
        user_name: userName.trim(),
        password: password,
      });

      const token =
        res.data?.access_token ||
        res.data?.token ||
        res.data?.data?.access_token ||
        res.data?.data?.token;

      if (!token) throw new Error("Login สำเร็จแต่ไม่พบ token");

      setToken(token);

      // ✅ ดึง role จาก backend หรือแยกจาก username
      const role =
        res.data?.role ||
        res.data?.data?.role ||
        (userName === "SuperAdmin" ? "SuperAdmin" : "Admin");

      localStorage.setItem("role", role);

      nav(role === "SuperAdmin" ? "/super-admin" : "/form", {
        replace: true,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-2xl font-semibold">Admin Login</div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 whitespace-pre-wrap">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Username</label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
               placeholder="Username"
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
               placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
            />
          </div>
          <button
            disabled={submitting}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}
