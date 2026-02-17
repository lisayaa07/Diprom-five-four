// src/AdminLogin.tsx (หรือ src/pages/AdminLogin.tsx แล้วแต่โครงสร้างคุณ)
import React, { useState, type FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setToken, getRole, isLoggedIn } from "./lib/Auth";

const DB_API_BASE_URL = import.meta.env.VITE_DB_API_BASE_URL as string;

async function safeReadJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export default function AdminLogin() {
  const nav = useNavigate();
  const [userName, setUserName] = useState("Admin");
  const [password, setPassword] = useState("1234");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ถ้า login อยู่แล้ว → ส่งไปหน้าตาม role ทันที
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

      const res = await fetch(`${DB_API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          user_name: userName.trim(), // ✅ สำคัญ
          password: password,
        }),
      });

      const json = await safeReadJson(res);
      if (!res.ok) throw new Error(`DB HTTP ${res.status}\n${JSON.stringify(json, null, 2)}`);

      const token =
        json?.access_token || json?.token || json?.data?.access_token || json?.data?.token;

      if (!token) throw new Error("Login สำเร็จแต่ไม่พบ token ใน response");

      setToken(token);

      const role = getRole();
      nav(role === "SuperAdmin" ? "/super-admin" : "/form", { replace: true });
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
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
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
