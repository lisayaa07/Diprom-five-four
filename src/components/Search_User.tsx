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

 // Search_User.tsx (ส่วน useEffect)

// Search_User.tsx

useEffect(() => {
  if (!q) return;

  // Search_User.tsx (ส่วน useEffect)

const run = async () => {
  setLoading(true);
  try {
    const searchLower = q.toLowerCase();
    const [allComps, allOrders] = await Promise.all([
      dbFetchJson<any[]>("/companies"),
      dbFetchJson<any[]>("/orders")
    ]);

    // 1. ค้นหา Orders ที่ Match กับชื่อลูกค้า หรือรายละเอียดงาน
    const matchedOrders = allOrders.filter(o => 
      (o.customer_name || "").toLowerCase().includes(searchLower) ||
      (o.detail_work || "").toLowerCase().includes(searchLower)
    );

    // 2. ค้นหาบริษัทที่ Match (Company/Tax)
    const matchedComps = allComps.filter(c => 
      (c.company || "").toLowerCase().includes(searchLower) ||
      (c.tax || "").toLowerCase().includes(searchLower)
    );

    const map: Record<string, OrderDoc[]> = {};
    const finalFilteredComps: any[] = [...matchedComps];

    // 3. จัดกลุ่ม Order ที่มีบริษัทผูกอยู่
    allOrders.forEach(o => {
      const cId = String(o.id_company || "");
      if (cId && (matchedComps.some(mc => mc._id === cId) || matchedOrders.some(mo => mo._id === o._id))) {
        if (!map[cId]) {
          map[cId] = [];
          // ถ้าบริษัทนี้ยังไม่มีใน list (แต่เจอจากชื่อลูกค้าใน order) ให้ดึงมาใส่
          if (!finalFilteredComps.some(fc => fc._id === cId)) {
            const compData = allComps.find(ac => ac._id === cId);
            if (compData) finalFilteredComps.push(compData);
          }
        }
        map[cId].push(o);
      }
    });

    // 4. 📌 ส่วนสำคัญ: จัดการลูกค้าทั่วไปที่ไม่มีบริษัท (id_company: null)
    // เราจะแยกตามชื่อลูกค้า (customer_name) เพื่อให้หัวข้อแสดงเป็นชื่อคน
    const personalOrders = matchedOrders.filter(o => !o.id_company);
    
    // ใช้ Set เพื่อหาชื่อลูกค้าที่ไม่ซ้ำกัน
    const uniquePersonalNames = Array.from(new Set(personalOrders.map(o => o.customer_name || "ไม่ระบุชื่อ")));

    uniquePersonalNames.forEach(name => {
      const personalId = `personal_${name}`; // สร้าง ID ชั่วคราวจากชื่อ
      finalFilteredComps.push({
        _id: personalId,
        company: name, // ✅ เปลี่ยนชื่อหัวข้อจาก "ลูกค้าทั่วไป" เป็น "ชื่อลูกค้า"
        tax: (personalOrders.find(po => po.customer_name === name)?.detail_work || "").match(/TAX ID:\s*(\d+)/)?.[1] || "",
        count: personalOrders.filter(po => po.customer_name === name).length
      });
      map[personalId] = personalOrders.filter(po => po.customer_name === name);
    });

    setCompanies(finalFilteredComps);
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