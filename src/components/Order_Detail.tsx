import  { useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PDFDownloadLink,PDFViewer } from '@react-pdf/renderer';
import { dbFetchJson } from "../lib/dbClient"; // ✅ ปรับ path ให้ตรงโปรเจกต์

import MyPdfDocument from './PDF';
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




  function pickLine(notes: string, label: string): string {
  const re = new RegExp(`^${label}\\s*:\\s*(.*)$`, "m");
  const m = notes.match(re);
  return m?.[1]?.trim() ?? "";
  }

  function removeDuplicateLines(notes: string): string {
  const dropPrefixes = [
    "ชื่อ:", "ประเภท:","ประเภทงาน:", "เบอร์โทร:", "อีเมล:", "Line:", "ที่อยู่:",
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
      // ✅ ดึง order จาก Mongo
      const json = await dbFetchJson<any>(`/orders/${encodeURIComponent(orderId)}`, {
        method: "GET",
      });

      // รองรับทั้ง {data:...} หรือ {...}
      const order = json?.data ?? json;
      if (!order) throw new Error("ไม่พบงานนี้ในระบบ");

      // ✅ ดึง company เพิ่ม (ถ้า backend มี /companies/:id)
      let company: any = null;
      const companyId = String(order?.id_company ?? order?.company ?? "");
      if (companyId) {
        try {
          const cJson = await dbFetchJson<any>(`/companies/${encodeURIComponent(companyId)}`, {
            method: "GET",
          });
          company = cJson?.data ?? cJson;
        } catch {
          // ถ้า backend ไม่มี endpoint นี้ ก็ไม่เป็นไร
        }
      }

      // ✅ สร้าง shape ให้ใกล้ของเดิม เพื่อไม่ต้องแก้ UI เยอะ
      setData({
        ok: true,
        found: true,
        user: {
          tax: String(company?.tax ?? ""),
          companyName: String(company?.companyName ?? company?.company ?? ""),
        },
        order: {
          ID_Order: String(order?._id ?? order?.id ?? orderId),
          customerName: String(order?.customer_name ?? ""),
          phone: String(order?.phone ?? ""),
          email: String(order?.email ?? ""),
          line: String(order?.line ?? ""),
          address: String(order?.address ?? ""),
          startDate: String(order?.start_date ?? ""),
          endDate: String(order?.end_date ?? ""),
          projectName: String(order?.type_work ?? ""), // จะโชว์ id หรือชื่อแล้วแต่คุณอยาก map
          quantity: String(order?.count_work ?? ""),
          notes: String(order?.detail_work ?? ""),
          files: String(order?.file ?? ""),
        },
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  run();
}, [orderId]);


   function extractNoteValue(notes: string, label: string): string {
  if (!notes) return "-";

  const target = label.trim().toLowerCase();
  const lines = notes.split(/\r?\n/);

  // helper: เอาค่าหลัง prefix ออกมา (trim)
  const afterPrefix = (line: string, prefix: string) =>
    line.slice(prefix.length).trim();

  // 1) หาแบบอยู่ต้นบรรทัดก่อน
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const low = line.toLowerCase();

    // ต้องขึ้นต้นด้วย label
    if (!low.startsWith(target)) continue;

    // (A) แบบ "label: value"
    const colonIdx = line.indexOf(":");
    if (colonIdx >= 0) {
      const left = line.slice(0, colonIdx).trim().toLowerCase();
      if (left === target) {
        return line.slice(colonIdx + 1).trim() || "-";
      }
    }

    // (B) แบบ "label/ value" หรือ "label ... /value" (เช่น "รันนัมเบอร์ สี/แดง")
    const slashIdx = line.indexOf("/");
    if (slashIdx >= 0) {
      const left = line.slice(0, slashIdx).trim().toLowerCase();
      if (left === target) {
        return line.slice(slashIdx + 1).trim() || "-";
      }
    }

    // (C) แบบ "label value" ไม่มี ":" (เช่น "เล่มที่ 3", "เลขที่ 1-100")
    if (low === target) return "-"; // มี label เฉยๆ
    return afterPrefix(line, label) || "-";
  }

  // 2) รองรับบรรทัดแบบมี | เช่น "ขนาดสำเร็จ: ... | ขนาดตัดกระดาษ: ..."
  for (const raw of lines) {
    for (const seg of raw.split("|")) {
      const line = seg.trim();
      if (!line) continue;

      const low = line.toLowerCase();
      if (!low.startsWith(target)) continue;

      const colonIdx = line.indexOf(":");
      if (colonIdx >= 0) {
        const left = line.slice(0, colonIdx).trim().toLowerCase();
        if (left === target) {
          return line.slice(colonIdx + 1).trim() || "-";
        }
      }

      const slashIdx = line.indexOf("/");
      if (slashIdx >= 0) {
        const left = line.slice(0, slashIdx).trim().toLowerCase();
        if (left === target) {
          return line.slice(slashIdx + 1).trim() || "-";
        }
      }

      if (low === target) return "-";
      return afterPrefix(line, label) || "-";
    }
  }

  return "-";
}
function hasNoteFlag(notes: string, label: string): boolean {
  if (!notes) return false;
  const target = label.trim().toLowerCase();

  return notes
    .split(/\r?\n/)
    .map(l => l.trim().toLowerCase())
    .some(l => l === target);
}




  const view = useMemo(() => {
    const order = data?.order;
    if (!order) return null;

    
    const jobName = pickLine(order.notes || "", "ชื่องาน");
    const cleanNotes = removeDuplicateLines(order.notes || "");
    const workTypeFromNotes = pickLine(order.notes || "", "ประเภทงาน") || pickLine(order.notes || "", "ประเภท");
    const cover = extractNoteValue(order.notes || "", "หน้าปก");
    const inside = extractNoteValue(order.notes || "", "เนื้อใน");
    const billTypes = extractNoteValue(order.notes || "", "งานบิล");
    const paperColor = extractNoteValue(order.notes || "", "ปะสันกระดาษ");
    const laxineColor = extractNoteValue(order.notes || "", "ปะสันแล็กซีน");
    const wire = extractNoteValue(order.notes || "", "เย็บลวด");
    const Adsan = extractNoteValue(order.notes || "", "อัดสัน");
    const glue = hasNoteFlag(order.notes || "", "ไสกาว");
    const folding = extractNoteValue(order.notes || "", "พับ");
    const details = extractNoteValue(order.notes || "", "อื่นๆ");
    const pos = extractNoteValue(order.notes || "", "ปรุ");
    const runColor = extractNoteValue(order.notes || "", "รันนัมเบอร์ สี");
    const book = extractNoteValue(order.notes || "", "เล่มที่");
    const rangeText = extractNoteValue(order.notes || "", "เลขที่");
    const detail = extractNoteValue(order.notes || "", "ขนาดสำเร็จ:");
    const count_Detail = extractNoteValue(order.notes || "", "จำนวนพิมพ์:");
    const detail_Type = extractNoteValue(order.notes || "", "รูปแบบ:");
    const typeOfWorkText = extractNoteValue(order.notes || "", "ชนิดรูปแบบงาน");
    const printer = extractNoteValue(order.notes || "", "เครื่องพิมพ์");

    return {
      jobName,
      cleanNotes,
      workTypeFromNotes,
      cover,
      order,
      inside,
      billTypes,
      paperColor,
      laxineColor,
      wire,
      Adsan,
       glue,
      folding,
      details,
      pos,
      runColor,
      book,
      rangeText,
      detail,
      count_Detail,
      detail_Type,
      typeOfWorkText,
      printer,

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

            <div>
              <b>ประเภทงาน:</b> {view.workTypeFromNotes || view.order.projectName || "-"}
            </div>

          <div><b>จำนวนสั่ง:</b> {view.order.quantity || "-"}</div>
          <div className="text-sm flex gap-2 items-center">
          <b>ไฟล์:</b>{" "}
          {(() => {
            const links = parseFileLinks(view.order.files || "");
            if (links.length === 0) return "-";
            return (
             <div className="flex flex-wrap gap-x-3 gap-y-1">
              {links.map((f, i) => (
                <span key={`${f.name}-${i}`}>
                  {f.url ? (
                    <a href={f.url} target="_blank" rel="noreferrer" className="underline text-blue-600 hover:text-blue-800">
                      {f.name}
                    </a>
                  ) : (
                    <span>{f.name}</span>
                  )}
                  {i < links.length - 1 && <span className="ml-1">,</span>}
                </span>
              ))}
            </div>
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
          {view && data?.user && (
            <div className="mt-4">
              <PDFDownloadLink
                document={
                  <MyPdfDocument
                    customername={view.order.customerName}
                    address={view.order.address}
                    email={data.order?.email || "-"}
                    companyName={data.user.companyName || "-"}
                    orderDate={data.order?.startDate || "-"}
                    dueDate={data.order?.endDate || "-"}
                    jobName={view.jobName || "-"}
                    phone={view.order.phone}
                    line={view.order.line || "-"}
                    quantity={ view.order.quantity || "-"}
                    cover={view.cover || "-"}
                    inside={view.inside || "-"}
                    billTypes={view.billTypes || "-"}
                    paperColor={view.paperColor || "-"}
                    laxineColor={view.laxineColor || "-"}
                    wire={view.wire || "-"}
                    Adsan={view.Adsan || "-"}
                    glue={view?.glue ? "ใช่" : "ไม่ใช่"}

                    folding={view.folding || "-"}
                    details={view.details || "-"}
                    pos={view.pos || "-"}
                    color={view.runColor || "-"}
                    book={view.book || "-"}
                    rangeText={view.rangeText || "-"}
                    detail={view.detail || "-"}
                    count_Detail={view.count_Detail || "-"}
                    detail_Type={view.detail_Type || "-"}
                    typeOfWorkText={view.typeOfWorkText || "-"}
                    printer={view.printer || "-"}
                   
                  />

                }
                fileName={`order-${data.order?.ID_Order}.pdf`}
              >
                {({ loading }) => (
                  <button
                    type="button"
                    className="rounded-xl bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    {loading ? "กำลังสร้าง PDF..." : "ดาวน์โหลด PDF"}
                  </button>
                )}
              </PDFDownloadLink>
               <PDFViewer width="100%" height={600} style={{ border: '1px solid #ccc' }}>
                          <MyPdfDocument

                           customername={view.order.customerName}
                           address={view.order.address}
                            phone={view.order.phone}
                            email={data.order?.email || "-"}
                            companyName={data.user.companyName || "-"}
                            orderDate={data.order?.startDate || "-"}
                            dueDate={data.order?.endDate || "-"}
                            jobName={view.jobName || "-"}
                            line={view.order.line || "-"}
                            workTypeFromNotes={view.workTypeFromNotes || "-"}
                            quantity={ view.order.quantity || "-"}
                            cover={view.cover || "-"}
                            inside={view.inside || "-"}
                            billTypes={view.billTypes || "-"}
                            paperColor={view.paperColor || "-"}
                            laxineColor={view.laxineColor || "-"}
                            wire={view.wire || "-"}  
                            Adsan={view.Adsan || "-"}
                            glue={view?.glue ? "ใช่" : "ไม่ใช่"}
                            folding={view.folding || "-"}
                            details={view.details || "-"}
                            pos={view.pos || "-"}
                            color={view.runColor || "-"}
                            book={view.book || "-"}
                            rangeText={view.rangeText || "-"}
                            detail={view.detail || "-"}
                            count_Detail={view.count_Detail || "-"}
                            detail_Type={view.detail_Type || "-"}
                            typeOfWorkText={view.typeOfWorkText || "-"}
                            printer={view.printer || "-"}
                          
                          />
                        </PDFViewer>
            </div>
          )}


        </div>
      )}
    </div>
  );
}
