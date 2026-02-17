// src/SuperAdmin.tsx
import React, { useEffect, useMemo, useState } from "react";
import { getToken, clearToken } from "./lib/Auth";
import { useNavigate } from "react-router-dom";

const DB_API_BASE_URL = import.meta.env.VITE_DB_API_BASE_URL as string;

type MasterItem = { _id: string; [k: string]: any };

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra as any),
  };
}

async function safeReadJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function dbFetchJson(path: string, init?: RequestInit) {
  const res = await fetch(`${DB_API_BASE_URL}${path}`, {
    ...init,
    headers: authHeaders(init?.headers),
  });
  const json = await safeReadJson(res);
  if (!res.ok) throw new Error(`DB HTTP ${res.status}\n${JSON.stringify(json, null, 2)}`);
  return json;
}

type ResourceConf = {
  key: "printers" | "type-works" | "colors";
  title: string;
  listPath: string;
  createPath: string;
  deletePath: (id: string) => string;
  nameField: string; // field ที่ backend ใช้เก็บชื่อ
  label: string;
};

export default function SuperAdmin() {
  const nav = useNavigate();

  const resources: ResourceConf[] = useMemo(
    () => [
      {
        key: "printers",
        title: "Printers",
        listPath: "/printers",
        createPath: "/printers",
        deletePath: (id) => `/printers/${id}`,
        nameField: "name_printer",
        label: "ชื่อเครื่องพิมพ์",
      },
      {
        key: "type-works",
        title: "Type Works",
        listPath: "/type-works",
        createPath: "/type-works",
        deletePath: (id) => `/type-works/${id}`,
        nameField: "name_tw",
        label: "ชื่อประเภทงาน",
      },
      {
        key: "colors",
        title: "Colors",
        listPath: "/colors",
        createPath: "/colors",
        deletePath: (id) => `/colors/${id}`,
        nameField: "name_color",
        label: "ชื่อสี",
      },
    ],
    [],
  );

  const [tab, setTab] = useState<ResourceConf["key"]>("type-works");
  const conf = resources.find((r) => r.key === tab)!;

  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [name, setName] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const json = await dbFetchJson(conf.listPath, { method: "GET" });
      const list = Array.isArray(json) ? json : json?.data ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setName("");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const onCreate = async () => {
    if (!name.trim()) return;
    try {
      setLoading(true);
      setErr("");
      await dbFetchJson(conf.createPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [conf.nameField]: name.trim() }),
      });
      setName("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("ต้องการลบรายการนี้ใช่ไหม?")) return;
    try {
      setLoading(true);
      setErr("");
      await dbFetchJson(conf.deletePath(id), { method: "DELETE" });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold text-slate-900">SuperAdmin</div>
          <div className="text-sm text-slate-600">จัดการ Master DB (เพิ่ม/ลบข้อมูล)</div>
        </div>

        <div className="flex gap-2">
          <button
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm"
            onClick={() => nav("/form")}
          >
            ไปหน้า Form
          </button>
          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => {
              clearToken();
              nav("/admin/login", { replace: true });
            }}
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-10">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {resources.map((r) => (
            <button
              key={r.key}
              onClick={() => setTab(r.key)}
              className={[
                "rounded-xl px-4 py-2 text-sm border",
                tab === r.key
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-800 border-slate-300",
              ].join(" ")}
            >
              {r.title}
            </button>
          ))}
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 whitespace-pre-wrap">
            {err}
          </div>
        )}

        {/* Create */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-lg font-semibold text-slate-900">{conf.title}</div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={conf.label}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
            />
            <button
              disabled={loading}
              onClick={onCreate}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              เพิ่ม
            </button>
          </div>
        </div>

        {/* List */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">รายการทั้งหมด</div>
            <button
              disabled={loading}
              onClick={load}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-60"
            >
              รีเฟรช
            </button>
          </div>

          {loading ? (
            <div className="p-5 text-sm text-slate-600">กำลังโหลด...</div>
          ) : items.length === 0 ? (
            <div className="p-5 text-sm text-slate-600">ยังไม่มีข้อมูล</div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {items.map((it) => (
                <li key={it._id} className="px-5 py-3 flex items-center justify-between">
                  <div className="text-sm text-slate-900">
                    {String(it[conf.nameField] ?? it.name ?? it.title ?? "-")}
                  </div>
                  <button
                    onClick={() => onDelete(it._id)}
                    className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm text-rose-700"
                  >
                    ลบ
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
