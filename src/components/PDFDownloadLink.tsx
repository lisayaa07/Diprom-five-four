import { type JSX, useMemo } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import MyPdfDocument from "./PDF";

type Props = {
  formData: any;
  formId: string;        // ✅ id ของ <form>
  fileName?: string;
  notes?: string;
};
function parseNotesToMap(notes: string): Record<string, string> {
  const map: Record<string, string> = {};
  if (!notes) return map;

  for (const raw of notes.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const idx = line.indexOf(":") >= 0 ? line.indexOf(":") : line.indexOf("：");
    if (idx < 0) continue;

    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (!key) continue;

    map[key] = val || "";
  }
  return map;
}

function pickNote(map: Record<string, string>, key: string, fallback = "-") {
  const v = map[key];
  return v && v.trim() ? v.trim() : fallback;
}



const getStr = (fd: FormData, key: string) => String(fd.get(key) || "").trim();

const getAllStr = (fd: FormData, key: string) =>
  fd.getAll(key).map(x => String(x).trim()).filter(Boolean);

const checked = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
};
const pickFromForm = (fd: FormData | null, key: string, fallback: any = "-") => {
  if (!fd) return (String(fallback || "").trim() || "-");
  const v = String(fd.get(key) || "").trim();
  return v || (String(fallback || "").trim() || "-");
};


export default function PDFDownloadButton({ formData, formId, fileName ,notes}: Props): JSX.Element {
  const doc = useMemo(() => {
    
    const formEl = document.getElementById(formId) as HTMLFormElement | null;
    const fd = formEl ? new FormData(formEl) : null;
    const noteMap = parseNotesToMap(String(notes)||formData?.notes||"");
    
    

    // ถ้าไม่เจอ form ก็ใช้ formData เท่าที่มี
    const cover = fd ? getStr(fd, "paper_cover") : (formData.cover || "-");
    const inside = fd ? getStr(fd, "paper_inside") : (formData.inside || "-");
    const billTypes = fd ? getAllStr(fd, "billType").join(", ") : (formData.billTypes || "-");
    const paperColor = fd ? getStr(fd, "pasansee_paper_color") : (formData.paperColor || "-");
    const laxineColor = fd ? getStr(fd, "pasansee_laxine_color") : (formData.laxineColor || "-");

    const wire = fd && checked(fd, "bind_wire_enabled") ? getStr(fd, "bind_wire_pos") || "เย็บลวด" : "-";
    const Adsan = fd && checked(fd, "bind_press_enabled") ? getStr(fd, "bind_press_pos") || "อัดสัน" : "-";
    const glue = fd ? (checked(fd, "bind_glue") ? "ใช่" : "ไม่ใช่") : (formData.glue ? "ใช่" : "ไม่ใช่");
    const folding = fd && checked(fd, "bind_fold") ? (getStr(fd, "bind_fold_detail") || "พับ") : "-";
    // const details = fd && checked(fd, "bind_other_detail") ? (getStr(fd, "bind_other_detail") || "อื่นๆ") : "-";
    // const pos = fd && checked(fd, "bind_perforate_pos") ? (getStr(fd, "bind_perforate_pos") || "ปรุ") : "-";


    return (
  <MyPdfDocument
    customername={pickFromForm(fd, "fullName", formData.fullName)}
    phone={pickFromForm(fd, "phoneNumber", formData.phoneNumber)}
    email={pickFromForm(fd, "email", formData.email)}
    companyName={pickFromForm(fd, "company", formData.company)}
    orderDate={pickFromForm(fd, "startDate", formData.startDate)}
    dueDate={pickFromForm(fd, "endDate", formData.endDate)}
    jobName={pickFromForm(fd, "jobName", formData.jobName)}
    line={pickFromForm(fd, "lineId", formData.lineId)}
    quantity={pickFromForm(fd, "quantity", formData.quantity)}

    address={pickFromForm(fd, "address", formData.address)}
    workTypeFromNotes={pickNote(noteMap, "ประเภทงาน", formData.workType || "-")}


    cover={cover || "-"}
    inside={inside || "-"}
    billTypes={billTypes || "-"}
    paperColor={paperColor || "-"}
    laxineColor={laxineColor || "-"}

    wire={wire || "-"}
    Adsan={Adsan || "-"}
    glue={glue}
    folding={folding || "-"}

    // ✅ ส่วนนี้เดิมคุณอ่านจาก formData อย่างเดียว ทำให้หาย
    details={pickFromForm(fd, "bind_other_detail", formData.bind_other_detail)}
    pos={pickFromForm(fd, "bind_perforate_pos", formData.bind_perforate_pos)}
    color={pickFromForm(fd, "bind_run_color", formData.bind_run_color)}
    book={pickFromForm(fd, "bind_run_book", formData.bind_run_book)}
    rangeText={pickFromForm(fd, "bind_run_range", formData.bind_run_range)}
    detail={pickFromForm(fd, "detail", formData.detail)}
    count_Detail={pickFromForm(fd, "count_Detail", formData.count_Detail)}
    detail_Type={pickFromForm(fd, "Detail_Type", formData.Detail_Type)}
    typeOfWorkText={pickFromForm(fd, "type_of_work", formData.type_of_work)}
    printer={pickFromForm(fd, "printer", formData.printer)}
    
  />
);

  },  [formData, formId, notes]);

console.log("มาจากformData na",formData )
console.log("doc",doc)
  return (
    <PDFDownloadLink
      document={doc}
      fileName={fileName || `order-${formData.jobName || "print"}-${formData.startDate || ""}.pdf`}
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
  );
}
