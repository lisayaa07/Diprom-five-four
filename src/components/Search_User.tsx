import React, { useEffect, useState, type JSX } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

type GasSearchResp = {
  ok: boolean;
  found?: boolean;
  users?: Array<{
    ID_User: string;
    tax: string;
    ชื่อบริษัท: string;
    จำนวนครั้งที่เคยใช้บริการ: number;
  }>;
  ordersByUser?: Record<
    string,
    Array<{
      ID_Order: string;
      ประเภทงาน: string;
      วันรับงาน: string;
      วันส่งงาน: string;
      จำนวนสั่ง: string;
    }>
  >;
  error?: string;
};

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbyMeWdrpkC-sg-ByX2g9q64vAR5AahB3-5hAH9DdME220JmWoOTgQfZ_0ZrYRXPpyhnHQ/exec";

export default function Searh_User(): JSX.Element {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const q = (params.get("q") || "").trim();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [data, setData] = useState<GasSearchResp | null>(null);

  useEffect(() => {
    if (!q) return;

    const run = async () => {
      setLoading(true);
      setErr("");
      setData(null);

      try {
        const url = new URL(GAS_URL);
        url.searchParams.set("action", "searchByCompany");
        url.searchParams.set("q", q);

        const res = await fetch(url.toString());
        const text = await res.text();
        const json = JSON.parse(text) as GasSearchResp;

        if (!res.ok) throw new Error(`HTTP ${res.status}\n${text}`);
        if (!json.ok) throw new Error(json.error || "GAS ok:false");

        setData(json);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [q]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">ประวัติลูกค้า</div>
        <button
          type="button"
          onClick={() => nav("/form")}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          กลับไปฟอร์ม
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        ค้นหา: <span className="font-semibold">{q || "-"}</span>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          กำลังค้นหา...
        </div>
      )}

      {err && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 whitespace-pre-wrap">
          {err}
        </div>
      )}

      {data?.found === false && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          ไม่พบข้อมูล
        </div>
      )}

      {data?.users?.map((u) => {
        const orders = data.ordersByUser?.[u.ID_User] ?? [];
        return (
          <div key={u.ID_User} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="font-semibold">{u.ชื่อบริษัท}</div>
            <div className="text-xs text-slate-600">
              tax: {u.tax || "-"} • ใช้บริการแล้ว {u.จำนวนครั้งที่เคยใช้บริการ || 0} ครั้ง
            </div>

            <div className="mt-3 text-sm font-medium">รายการงาน</div>
            {orders.length === 0 ? (
              <div className="mt-2 text-sm text-slate-600">ยังไม่มีรายการงาน</div>
            ) : (
              <ul className="mt-2 space-y-2">
                {orders.map((o) => (
                  <li key={o.ID_Order}>
                    <button
                      type="button"
                      onClick={() => nav(`/form?order_id=${encodeURIComponent(o.ID_Order)}`)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <div className="font-medium">
                        {o.ประเภทงาน || "(ไม่ระบุประเภทงาน)"} • จำนวน {o.จำนวนสั่ง || "-"}
                      </div>
                      <div className="text-xs text-slate-600">
                        รับงาน: {o.วันรับงาน || "-"} • ส่งงาน: {o.วันส่งงาน || "-"}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
