import  { useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";

type GasOrderDetailResp = {
  ok: boolean;
  found?: boolean;
  error?: string;
  user?: { tax?: string; companyName?: string } | null;
  order?: {
    ID_Order: string;
    customerName: string;
    phone: string;
    email: string;
    line: string;
    address: string;
    startDate: string;   // วันสั่งงาน (ตามที่คุณใช้ในฟอร์ม)
    endDate: string;     // วันรับงาน
    projectName: string;
    quantity: string;
    notes: string;
    files: string;
  };
};
type FileLink = { name: string; url: string };

function parseFileLinks(raw: string): FileLink[] {
  const s = (raw || "").trim();
  if (!s) return [];

  // รูปแบบใหม่: JSON string เช่น [{"name":"..","url":".."}]
  try {
    const j = JSON.parse(s);
    if (Array.isArray(j)) {
      return j
        .map((x) => {
          if (!x || typeof x !== "object") return null;
          const name = x.name;
          const url = x.url;
          if (typeof name !== "string") return null;
          return { name, url: typeof url === "string" ? url : "" };
        })
        .filter(Boolean) as FileLink[];
    }
  } catch {
    // ignore
  }

  // fallback: ถ้าเป็น "a.pdf, b.ai"
 return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((name) => ({ name, url: "" }));
}


const GAS_URL =
  "https://script.google.com/macros/s/AKfycbxalbLbNad6Ni2EmsbbuYqj4uCuJGoOQ1kEJP6ky4kjWKXVnmhrW6Dci3WgrbpKASvy/exec";

function pickLine(notes: string, label: string): string {
  const re = new RegExp(`^${label}\\s*:\\s*(.*)$`, "m");
  const m = notes.match(re);
  return m?.[1]?.trim() ?? "";
}

function removeDuplicateLines(notes: string): string {
  const dropPrefixes = [
    "ชื่อ:", "ประเภท:", "เบอร์โทร:", "อีเมล:", "Line:", "ที่อยู่:",
    "ชื่องาน:", "จำนวนสั่ง:", "วันเริ่ม:", "วันสิ้นสุด:",
    "วันสั่งงาน:", "วันรับงาน:", "วันส่งงาน:",
  ];
  return notes
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !dropPrefixes.some((p) => l.startsWith(p)))
    .join("\n");
}

export default function Order_Detail(): JSX.Element {
  const nav = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [data, setData] = useState<GasOrderDetailResp | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const run = async () => {
      setLoading(true);
      setErr("");
      setData(null);

      try {
        const url = new URL(GAS_URL);
        url.searchParams.set("action", "getOrderById");
        url.searchParams.set("order_id", orderId);

        const res = await fetch(url.toString());
        const text = await res.text();
        const json = JSON.parse(text) as GasOrderDetailResp;

        if (!res.ok) throw new Error(`HTTP ${res.status}\n${text}`);
        if (!json.ok) throw new Error(json.error || "GAS ok:false");
        if (!json.found) throw new Error("ไม่พบงานนี้ในระบบ");

        setData(json);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [orderId]);

  const view = useMemo(() => {
    const order = data?.order;
    if (!order) return null;

    // ชื่องาน: ถ้ามีใน notes แบบ "ชื่องาน: xxx" จะดึงมาแสดง (ไม่ซ้ำ)
    const jobName = pickLine(order.notes || "", "ชื่องาน");
    const cleanNotes = removeDuplicateLines(order.notes || "");

    return {
      jobName,
      cleanNotes,
      order,
    };
  }, [data]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 text-slate-900">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">รายละเอียดงาน (อ่านอย่างเดียว)</div>
        <button
          type="button"
          onClick={() => nav(-1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
        >
          กลับ
        </button>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          กำลังโหลด...
        </div>
      )}

      {err && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 whitespace-pre-wrap">
          {err}
        </div>
      )}

      {view && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 text-sm">
          <div><b>ID งาน:</b> {view.order.ID_Order}</div>

          {view.jobName && <div><b>ชื่องาน:</b> {view.jobName}</div>}
          <div><b>วันสั่งงาน:</b> {view.order.startDate || "-"}</div>
          <div><b>วันรับงาน:</b> {view.order.endDate || "-"}</div>

          <hr className="my-2" />

          <div><b>ชื่อลูกค้า:</b> {view.order.customerName || "-"}</div>
          <div><b>เบอร์โทร:</b> {view.order.phone || "-"}</div>
          <div><b>อีเมล:</b> {view.order.email || "-"}</div>
          <div><b>ไลน์:</b> {view.order.line || "-"}</div>
          <div className="whitespace-pre-wrap"><b>ที่อยู่:</b> {view.order.address || "-"}</div>

          <hr className="my-2" />

          <div><b>ประเภทงาน:</b> {view.order.projectName || "-"}</div>
          <div><b>จำนวนสั่ง:</b> {view.order.quantity || "-"}</div>
          <div className="text-sm">
          <b>ไฟล์:</b>{" "}
          {(() => {
            const links = parseFileLinks(view.order.files || "");
            if (links.length === 0) return "-";
            return (
              <ul className="mt-1 space-y-1">
                {links.map((f, i) => (
                  <li key={`${f.name}-${i}`}>
                    {f.url ? (
                      <a href={f.url} target="_blank" rel="noreferrer" className="underline">
                        {f.name}
                      </a>
                    ) : (
                      <span>{f.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>


          {view.cleanNotes && (
            <>
              <hr className="my-2" />
              <div className="font-semibold">รายละเอียดเพิ่มเติม (จาก description)</div>
              <pre className="whitespace-pre-wrap text-slate-700">{view.cleanNotes}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
