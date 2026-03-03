import { useEffect, useState, type JSX } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { dbFetchJson } from "./lib/dbClient"; 
import SearchBox from "./components/Search_Box"; 

// --- Types ---
type OrderDoc = {
  _id: string;
  id_company?: string;
  customer_name?: string;
  type_work?: string;
  start_date?: string;
  end_date?: string;
  detail_work?: string;
  file?: string;
};

type CompanyDoc = {
  _id: string;
  company?: string;
  tax?: string;
  count?: number;
};

// --- Helpers ---
function pickJobName(notes: string): string {
  const re = /^ชื่องาน\s*:\s*(.*)$/m;
  const m = notes.match(re);
  return m?.[1]?.trim() ?? "";
}

const dateOnly = (v: any) => {
  const s = String(v || "").trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : (s || "-");
};

export default function CustomerHistory(): JSX.Element {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const q = (params.get("q") || "").trim();

  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<CompanyDoc[]>([]);
  const [ordersByCompany, setOrdersByCompany] = useState<Record<string, OrderDoc[]>>({});

  useEffect(() => {
    if (!q) {
      setCompanies([]);
      setOrdersByCompany({});
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const searchLower = q.toLowerCase();
        const [allComps, allOrders] = await Promise.all([
          dbFetchJson<any[]>("/companies"),
          dbFetchJson<any[]>("/orders")
        ]);

        // 1. ค้นหาบริษัทที่ Match (ชื่อ หรือ TAX)
        const matchedComps = allComps.filter(c => 
          (c.company || "").toLowerCase().includes(searchLower) ||
          (c.tax || "").toLowerCase().includes(searchLower)
        );

        // 2. ค้นหางานที่ชื่อลูกค้าตรง
        const matchedOrders = allOrders.filter(o => 
          (o.customer_name || "").toLowerCase().includes(searchLower) ||
          (o.detail_work || "").toLowerCase().includes(searchLower)
        );

        const map: Record<string, OrderDoc[]> = {};
        const finalFilteredComps: any[] = [...matchedComps];

        // 3. จัดกลุ่มงานที่มีบริษัท
        allOrders.forEach(o => {
          const cId = String(o.id_company || "");
          if (cId && (matchedComps.some(mc => mc._id === cId) || matchedOrders.some(mo => mo._id === o._id))) {
            if (!map[cId]) {
              map[cId] = [];
              if (!finalFilteredComps.some(fc => fc._id === cId)) {
                const compData = allComps.find(ac => ac._id === cId);
                if (compData) finalFilteredComps.push(compData);
              }
            }
            map[cId].push(o);
          }
        });

        // 4. จัดการลูกค้าทั่วไปที่ไม่มีบริษัท
        const personalOrders = matchedOrders.filter(o => !o.id_company || o.id_company === "null");
        const uniquePersonalNames = Array.from(new Set(personalOrders.map(o => o.customer_name || "ไม่ระบุชื่อ")));

        uniquePersonalNames.forEach(name => {
          const personalId = `personal_${name}`;
          const latestOrder = personalOrders.find(po => po.customer_name === name);
          
          // ✅ ดึงเลข TAX จาก detail_work (เช่น TAX ID: 101114445258)
          const taxMatch = latestOrder?.detail_work?.match(/TAX ID:\s*(\d+)/);
          const taxValue = taxMatch ? taxMatch[1] : name; 

          finalFilteredComps.push({
            _id: personalId,
            company: name, 
            tax: taxValue, 
            count: personalOrders.filter(po => po.customer_name === name).length
          });
          map[personalId] = personalOrders.filter(po => po.customer_name === name);
        });

        setCompanies(finalFilteredComps);
        setOrdersByCompany(map);
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [q]);

  return (
    <div className="lg:ml-10 lg:mr-10 mt-5 space-y-6 text-slate-900 px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-xl font-bold">ประวัติลูกค้า</h1>
        <SearchBox /> 
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm shadow-sm">
        ผลการค้นหาสำหรับ: <span className="font-semibold text-indigo-600">{q || "-"}</span>
      </div>

      {loading && <div className="text-center py-10 text-slate-400">กำลังค้นหาข้อมูล...</div>}

      {!loading && companies.length === 0 && q && (
        <div className="p-20 text-center text-slate-400 bg-white rounded-2xl border border-dashed">
          ไม่พบข้อมูลลูกค้าหรือบริษัทที่คุณค้นหา
        </div>
      )}

      <div className="space-y-6">
        {companies.map((c) => {
          const orders = ordersByCompany[c._id] ?? [];
          const isPersonal = c._id.startsWith("personal_");
          return (
            <div key={c._id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{c.company}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {isPersonal ? " TAX ID : " : "TAX ID: "} 
                    <span className="font-semibold text-indigo-600">{c.tax || "-"}</span>
                  </p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                  ใช้บริการ {orders.length} ครั้ง
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase">ประวัติรายการงาน</p>
                {orders.map((o) => (
                  <button
                    key={o._id}
                    onClick={() => nav(`/order/${o._id}`)}
                    className="w-full text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50 transition-all group flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-slate-800 group-hover:text-indigo-700">
                        {o.id_company && o.id_company !== "null" ? (
                            // ✅ กรณีมีบริษัท: แสดง "ชื่องาน [ชื่อลูกค้า]"
                            <>
                            {pickJobName(o.detail_work || "") || o.type_work || "ชื่องานไม่ระบุ"}{" "}
                            [ลูกค้า : {o.customer_name || "ไม่ระบุชื่อ"}]
                            </>
                        ) : (
                            // ✅ กรณีไม่มีบริษัท (ลูกค้าทั่วไป): แสดงแค่ "ชื่อลูกค้า"
                            o.customer_name || "ไม่ระบุชื่อ"
                        )}
                        </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        เริ่ม: {dateOnly(o.start_date)} • รับงาน: {dateOnly(o.end_date)}
                      </div>
                    </div>
                    <div className="text-indigo-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      ดูรายละเอียด →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}