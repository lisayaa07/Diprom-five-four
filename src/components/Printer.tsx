import React, { useEffect, useState } from "react";
import axios from "../lib/axios";
const DB_API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

type PrinterDoc = {
  _id: string;
  name_printer: string;
  createdAt?: string;
  updatedAt?: string;
};

async function safeReadJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function fetchJsonOrThrow<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await safeReadJson(res);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}\n${JSON.stringify(json, null, 2)}`);
  }
  return json as T;
}

export default function Printer() {
  const [items, setItems] = useState<PrinterDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError("");

        // ✅ endpoint ของคุณคืน "array" ตรง ๆ
        // const json = await fetchJsonOrThrow<PrinterDoc[]>(
        //   `${DB_API_BASE_URL}/printers`,
        //   { headers: { Accept: "application/json",Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTkyYTUwMjE1NTg3ZTNjMmYwOTQ4MDIiLCJ1c2VyX25hbWUiOiJBZG1pbiIsInJvbGUiOiJBZG1pbiIsImV4cCI6MTc3MTQ2OTY1OH0.chuO_Wv7SSESIFxaJNP80XiSMtCyYnl1eijLg71oA2Y" } },
        // );

        const res = await axios.get("/printers")

        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("PRINTER FETCH ERROR:", e);
        setError(e instanceof Error ? e.message : String(e));
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <>
      <label>เครื่องพิมพ์</label>

      {loading && (
        <div className="mt-2 text-sm text-slate-500">กำลังโหลดรายการเครื่องพิมพ์...</div>
      )}

      {error && (
        <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700 whitespace-pre-wrap">
          โหลดเครื่องพิมพ์ไม่สำเร็จ: {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="mt-2 text-sm text-slate-500">ไม่มีรายการเครื่องพิมพ์ในระบบ</div>
      )}

      <div className="p-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 items-center text-base sm:text-sm text-slate-800">
        {items.map((p) => (
          <label key={p._id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="printer"
              value={p.name_printer} // ✅ สำคัญ: ใช้ name_printer ตาม DB
              className="h-4 w-4"
            />
            <span className="text-base sm:text-sm text-slate-800">{p.name_printer}</span>
          </label>
        ))}
      </div>
    </>
  );
}
