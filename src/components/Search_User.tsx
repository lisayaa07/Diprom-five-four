import { useEffect, useState, type JSX } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { dbFetchJson } from "../lib/dbClient";

type FileLink = { name: string; url: string };

// --- Helpers ---
function pickJobName(notes: string): string {
  const re = /^ชื่องาน\s*:\s*(.*)$/m;
  const m = notes.match(re);
  return m?.[1]?.trim() ?? "";
}

function parseFileLinks(raw: string): FileLink[] {
  const s = (raw || "").trim();
  if (!s) return [];
  try {
    const j = JSON.parse(s);
    if (Array.isArray(j)) {
      return j.map((x: any) => ({
        name: String(x.name || "ไฟล์แนบ"),
        url: typeof x.url === "string" ? x.url : ""
      })).filter(Boolean);
    }
  } catch { /* ignore */ }

  return s.split(",").map(x => x.trim()).filter(Boolean).map(name => ({
    name,
    url: name.startsWith("http") ? name : `/uploads/${name}` // เติม Path อัตโนมัติถ้าไม่มี URL
  }));
}

const dateOnly = (v: any) => {
  const s = String(v || "").trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : (s || "-");
};

// --- Types ---
type CompanyDoc = {
  _id: string;
  company?: string;
  tax?: string;
  count?: number;
};

type OrderDoc = {
  _id: string;
  id_company?: string;
  type_work?: string;
  start_date?: string;
  end_date?: string;
  detail_work?: string;
  file?: string;
};

export default function Search_User(): JSX.Element {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const q = (params.get("q") || "").trim();

  const [loading, setLoading] = useState(false);
  const [, setErr] = useState<string>("");
  const [companies, setCompanies] = useState<CompanyDoc[]>([]);
  const [ordersByCompany, setOrdersByCompany] = useState<Record<string, OrderDoc[]>>({});

  useEffect(() => {
    if (!q) return;

    const run = async () => {
      setLoading(true);
      setErr("");
      try {
        // 1. ค้นหาบริษัทตามชื่อ หรือ Tax ID
        const allComps = await dbFetchJson<any[]>("/companies");
        const filteredComps = allComps.filter(c => {
          const searchLower = q.toLowerCase();
          const nameMatch = (c.company || "").toLowerCase().includes(searchLower);
          const taxMatch = (c.tax || "").toLowerCase().includes(searchLower);
          return nameMatch || taxMatch;
        });

        setCompanies(filteredComps);

        // 2. ดึง Orders ทั้งหมดมา Filter เฉพาะของบริษัทที่ค้นเจอ
        const allOrders = await dbFetchJson<any[]>("/orders");
        const map: Record<string, OrderDoc[]> = {};
        
        filteredComps.forEach(comp => {
          map[comp._id] = allOrders.filter(order => 
            String(order.id_company || order.company) === comp._id
          );
        });

        setOrdersByCompany(map);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [q]);

  return (
    <div className="ml-20 mr-20 mt-5 space-y-6 text-slate-900">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">ประวัติลูกค้า</div>
        <button onClick={() => nav(-1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">กลับ</button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        ค้นหาบริษัท/เลขผู้เสียภาษี: <span className="font-semibold text-indigo-600">{q || "-"}</span>
      </div>

      {loading && <div className="p-4 text-sm text-slate-500 text-center">กำลังค้นหาข้อมูล...</div>}

      {!loading && companies.length === 0 && q && (
        <div className="p-10 text-center text-slate-400 bg-white rounded-xl border border-dashed">ไม่พบข้อมูลบริษัทหรือเลขผู้เสียภาษีนี้</div>
      )}

      {companies.map((c) => {
        const orders = ordersByCompany[c._id] ?? [];
        return (
          <div key={c._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-base font-bold text-slate-800">{c.company}</div>
                <div className="text-xs text-slate-500">Tax ID: {c.tax || "-"}</div>
              </div>
              <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
                ใช้บริการ {c.count || 0} ครั้ง
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-sm font-semibold text-slate-700 mb-3">ประวัติรายการงาน</div>
              
              {orders.length === 0 ? (
                <div className="text-xs text-slate-400 italic">ยังไม่มีรายการงานในระบบ</div>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => {
                    const fileLinks = parseFileLinks(o.file || "");
                    return (
                      <button
                        key={o._id}
                        onClick={() => nav(`/order/${o._id}`)}
                        className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
                      >
                        <div className="font-medium text-slate-800 group-hover:text-indigo-700">
                          {pickJobName(o.detail_work || "") || o.type_work || "ชื่องานไม่ระบุ"}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          รับงาน: {dateOnly(o.start_date)} • ส่งงาน: {dateOnly(o.end_date)}
                        </div>

                        {fileLinks.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-200/50">
                            <div className="text-[10px] font-bold text-slate-400 mb-1">ไฟล์แนบ:</div>
                            <ul className="space-y-1">
                              {fileLinks.map((f, i) => (
                                <li key={i} className="text-[11px]">
                                  <a
                                    href={f.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-600 underline hover:text-indigo-800"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {f.name}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}