import { useEffect, useState, type JSX } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { dbFetchJson } from "../lib/dbClient"; //

type FileLink = { name: string; url: string };

// ---------- helpers ----------
function pickJobName(notes: string): string {
  const re = /^ชื่องาน\s*:\s*(.*)$/m;
  const m = notes.match(re);
  return m?.[1]?.trim() ?? "";
}

function parseFileLinks(raw: string): FileLink[] {
  const s = (raw || "").trim();
  if (!s) return [];

  // 1) JSON string: [{"name":"..","url":".."}]
  try {
    const j = JSON.parse(s) as unknown;
    if (Array.isArray(j)) {
      return j
        .map((x) => {
          if (!x || typeof x !== "object") return null;
          const name = (x as any).name;
          const url = (x as any).url;
          if (typeof name !== "string") return null;
          return { name, url: typeof url === "string" ? url : "" };
        })
        .filter(Boolean) as FileLink[];
    }
  } catch {
    // ignore
  }

  // 2) "name: url" ต่อบรรทัด
  if (s.includes("\n") && s.includes(":")) {
    return s
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf(":");
        if (idx < 0) return { name: line, url: "" };
        const name = line.slice(0, idx).trim();
        const url = line.slice(idx + 1).trim();
        return { name, url };
      });
  }

  // 3) fallback "a.pdf, b.ai"
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((name) => ({ name, url: "" }));
}

const dateOnly = (v: any) => {
  const s = String(v || "").trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : (s || "-");
};

// ---------- Mongo types (ยืดหยุ่น) ----------
type CompanyDoc = {
  _id: string;
  company?: string;        // ชื่อบริษัท
  companyName?: string;    // บาง backend ใช้ชื่อ field นี้
  tax?: string;
  count?: number;          // จำนวนครั้งที่เคยใช้บริการ (อาจชื่ออื่น)
  count_use?: number;
  count_service?: number;
};

type OrderDoc = {
  _id: string;
  id_company?: string;
  type_work?: string;
  start_date?: string;
  end_date?: string;
  count_work?: number;
  detail_work?: string;
  file?: string;
};

// ---------- API helpers ----------
async function fetchCompanies(): Promise<CompanyDoc[]> {
  // พยายามเรียกแบบ "ได้ list"
  const json = await dbFetchJson<any>("/companies", { method: "GET" });
  const list = Array.isArray(json) ? json : (json?.data ?? []);
  return (Array.isArray(list) ? list : [])
    .map((x: any) => ({
      _id: String(x?._id ?? x?.id ?? ""),
      company: String(x?.company ?? "").trim(),
      companyName: String(x?.companyName ?? "").trim(),
      tax: String(x?.tax ?? "").trim(),
      count: typeof x?.count === "number" ? x.count : undefined,
      count_use: typeof x?.count_use === "number" ? x.count_use : undefined,
      count_service: typeof x?.count_service === "number" ? x.count_service : undefined,
    }))
    .filter((x) => x._id);
}

async function searchCompaniesByCompanyName(q: string): Promise<CompanyDoc[]> {
  const s = q.trim().toLowerCase();
  if (!s) return [];

  // ✅ ถ้า backend รองรับ query search ให้ลองก่อน
  const candidates = [
    `/companies/search?q=${encodeURIComponent(q)}`,
    `/companies?q=${encodeURIComponent(q)}`,
    `/companies?search=${encodeURIComponent(q)}`,
    `/companies?company=${encodeURIComponent(q)}`,
  ];

  for (const path of candidates) {
    try {
      const json = await dbFetchJson<any>(path, { method: "GET" });
      const list = Array.isArray(json) ? json : (json?.data ?? []);
      const normalized = (Array.isArray(list) ? list : [])
        .map((x: any) => ({
          _id: String(x?._id ?? x?.id ?? ""),
          company: String(x?.company ?? "").trim(),
          companyName: String(x?.companyName ?? "").trim(),
          tax: String(x?.tax ?? "").trim(),
          count: typeof x?.count === "number" ? x.count : undefined,
          count_use: typeof x?.count_use === "number" ? x.count_use : undefined,
          count_service: typeof x?.count_service === "number" ? x.count_service : undefined,
        }))
        .filter((x) => x._id);

      // ถ้าได้ผลลัพธ์จริง ให้ใช้เลย
      if (normalized.length > 0) return normalized;
    } catch {
      // ignore แล้วไป fallback
    }
  }

  // ✅ fallback: ดึงทั้งหมดแล้ว filter เอง
  const all = await fetchCompanies();
  return all.filter((c) => {
    const name = (c.companyName || c.company || "").toLowerCase();
    return name.includes(s);
  });
}

async function fetchOrdersByCompanyId(companyId: string): Promise<OrderDoc[]> {
  if (!companyId) return [];

  // ✅ ลอง endpoint ที่น่ามี
  const candidates = [
    `/orders?company=${encodeURIComponent(companyId)}`,
    `/orders?id_company=${encodeURIComponent(companyId)}`,
    `/orders/company/${encodeURIComponent(companyId)}`,
  ];

  for (const path of candidates) {
    try {
      const json = await dbFetchJson<any>(path, { method: "GET" });
      const list = Array.isArray(json) ? json : (json?.data ?? []);
      const normalized = (Array.isArray(list) ? list : [])
        .map((x: any) => ({
          _id: String(x?._id ?? x?.id ?? ""),
          id_company: String(x?.id_company ?? x?.company ?? x?.idCompany ?? ""),
          type_work: String(x?.type_work ?? x?.typeWork ?? ""),
          start_date: String(x?.start_date ?? x?.startDate ?? ""),
          end_date: String(x?.end_date ?? x?.endDate ?? ""),
          count_work: typeof x?.count_work === "number" ? x.count_work : Number(x?.count_work ?? 0),
          detail_work: String(x?.detail_work ?? x?.notes ?? ""),
          file: String(x?.file ?? x?.files ?? ""),
        }))
        .filter((x) => x._id);

      // ถ้าได้ผลลัพธ์จริง ให้ใช้เลย
      if (normalized.length >= 0) return normalized;
    } catch {
      // ignore แล้วไป fallback
    }
  }

  // ✅ fallback: ดึง orders ทั้งหมดแล้ว filter เอง
  const allJson = await dbFetchJson<any>("/orders", { method: "GET" });
  const allList = Array.isArray(allJson) ? allJson : (allJson?.data ?? []);
  const all = (Array.isArray(allList) ? allList : [])
    .map((x: any) => ({
      _id: String(x?._id ?? x?.id ?? ""),
      id_company: String(x?.id_company ?? x?.company ?? x?.idCompany ?? ""),
      type_work: String(x?.type_work ?? x?.typeWork ?? ""),
      start_date: String(x?.start_date ?? x?.startDate ?? ""),
      end_date: String(x?.end_date ?? x?.endDate ?? ""),
      count_work: typeof x?.count_work === "number" ? x.count_work : Number(x?.count_work ?? 0),
      detail_work: String(x?.detail_work ?? x?.notes ?? ""),
      file: String(x?.file ?? x?.files ?? ""),
    }))
    .filter((x) => x._id);

  return all.filter((o) => o.id_company === companyId);
}

// ---------- Component ----------
export default function Search_User(): JSX.Element {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const q = (params.get("q") || "").trim();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [companies, setCompanies] = useState<CompanyDoc[]>([]);
  const [ordersByCompany, setOrdersByCompany] = useState<Record<string, OrderDoc[]>>({});

  useEffect(() => {
    if (!q) return;

    const run = async () => {
      setLoading(true);
      setErr("");
      setCompanies([]);
      setOrdersByCompany({});

      try {
        const comps = await searchCompaniesByCompanyName(q);
        setCompanies(comps);

        const map: Record<string, OrderDoc[]> = {};
        for (const c of comps) {
          map[c._id] = await fetchOrdersByCompanyId(c._id);
        }
        setOrdersByCompany(map);
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

      {!loading && !err && companies.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          ไม่พบข้อมูล
        </div>
      )}

      {companies.map((c) => {
        const name = c.companyName || c.company || "-";
        const count =
          c.count_service ?? c.count_use ?? c.count ?? 0;

        const orders = ordersByCompany[c._id] ?? [];

        return (
          <div key={c._id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="font-semibold">{name}</div>
            <div className="text-xs text-slate-600">
              tax: {c.tax || "-"} • ใช้บริการแล้ว {count} ครั้ง
            </div>

            <div className="mt-3 text-sm font-medium">รายการงาน</div>

            {orders.length === 0 ? (
              <div className="mt-2 text-sm text-slate-600">ยังไม่มีรายการงาน</div>
            ) : (
              <ul className="mt-2 space-y-2">
                {orders.map((o) => (
                  <li key={o._id}>
                    <button
                      type="button"
                      onClick={() => nav(`/order/${encodeURIComponent(o._id)}`)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <div className="font-medium">
                        {pickJobName(o.detail_work || "") || o.type_work || "(ไม่ระบุชื่องาน)"}
                      </div>

                      <div className="text-xs text-slate-600">
                        รับงาน: {dateOnly(o.start_date)} • ส่งงาน: {dateOnly(o.end_date)}
                      </div>

                      {(() => {
                        const fileLinks = parseFileLinks(o.file ?? "");
                        if (fileLinks.length === 0) return null;

                        return (
                          <div className="mt-2 text-xs">
                            <b>ไฟล์:</b>
                            <ul className="mt-1 space-y-1">
                              {fileLinks.map((f, i) => (
                                <li key={`${f.name}-${i}`}>
                                  {f.url ? (
                                    <a
                                      href={f.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {f.name}
                                    </a>
                                  ) : (
                                    <span>{f.name}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })()}
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
