import React, { useEffect, useState, type FormEvent, type JSX } from "react";
import { User, ReceiptText } from "lucide-react";
import Paper_used from "./components/Paper_used";
import Pasansee from "./components/Pasansee";
import Binding from "./components/Binding";
import Details from "./components/Details";
import Subtask, { type SubtaskDraft } from "./components/Subtask";
import TypeOfWork from "./components/TypeOfWork";
import Printer from "./components/Printer";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "./config";
import PDFDownloadButton from "./components/PDFDownloadLink";
import { useNavigate } from "react-router-dom";
import Detail_Type from "./components/Detail_Type";
import Color from "./components/Color";
import AdditionalDetails from "./components/Notes";

const TOKEN_KEY = "admin_token"; // ให้ตรงกับตอน login เก็บไว้
type WorkTypeDoc = { _id: string; name_work: string };

function getAuthHeaders(extra?: HeadersInit): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY) || "";
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra as any),
  };
}

async function fetchDbJsonOrThrow(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  return await fetchJsonOrThrow(input, {
    ...init,
    headers: getAuthHeaders(init?.headers),
  });
}

type Project = { gid: string; name: string; resource_type?: string };
type State<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: string };

const WORKSPACE_GID = import.meta.env.VITE_WORKSPACE_GID as string;

// ✅ Mongo backend base url
const DB_API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

interface GridTask {
  data?: {
    gid?: string;
    data?: { gid?: string };
  };
  gid?: string;
}

const getTaskGid = (resp: GridTask): string | undefined => {
  return resp?.data?.gid || resp?.gid || resp?.data?.data?.gid;
};

type FileLink = { name: string; url: string };

type AsanaAttachment = {
  gid: string;
  name: string;
  permanent_url?: string;
   download_url?: string;
};

const parseUploadAttachment = (j: unknown): AsanaAttachment | null => {
  if (!j || typeof j !== "object") return null;

  const root = j as any;
  const data = root.data && typeof root.data === "object" ? root.data : root;

  const gid = data?.gid;
  const name = data?.name;
  const permanent_url = data?.permanent_url;

  if (typeof gid !== "string" || typeof name !== "string") return null;

  return {
    gid,
    name,
    permanent_url:
      typeof permanent_url === "string" ? permanent_url : undefined,
  };
};

type AsanaTaskMini = {
  gid: string;
  name?: string;
  permalink_url?: string;
};


const normalizeAsanaTask = (j: unknown): AsanaTaskMini | null => {
  if (!j || typeof j !== "object") return null;
  const root = j as any;
  const data = root.data && typeof root.data === "object" ? root.data : root;
  const gid = data?.gid;
  if (typeof gid !== "string") return null;
  const name = typeof data?.name === "string" ? data.name : undefined;
  const permalink_url =
    typeof data?.permalink_url === "string" ? data.permalink_url : undefined;
  return { gid, name, permalink_url };
};

async function safeReadJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function fetchJsonOrThrow(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<any> {
  const res = await fetch(input, init);
  const json = await safeReadJson(res);
  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status}\n${typeof json === "string" ? json : JSON.stringify(json, null, 2)}`,
    );
  }
  if (
    json &&
    typeof json === "object" &&
    "ok" in json &&
    (json as any).ok === false
  ) {
    throw new Error((json as any).error || "ok:false");
  }
  return json;
}

// ✅ ช่วยดึง id ที่ backend ส่งกลับมา (รองรับหลาย shape)
function pickId(obj: any): string | null {
  return (
    obj?._id ||
    obj?.id ||
    obj?.gid ||
    obj?.data?._id ||
    obj?.data?.id ||
    obj?.data?.gid ||
    obj?.company?._id ||
    obj?.company?.id ||
    null
  );
}

// ✅ upsert/create company (customer)
async function upsertCompany(payload: { company: string; tax?: string }) {
  try {
    return await fetchDbJsonOrThrow(`${DB_API_BASE_URL}/companies/upsert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return await fetchDbJsonOrThrow(`${DB_API_BASE_URL}/companies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }
}

// ✅ get order by id (แทน GAS getOrderById)
// backend ควรมี GET /orders/:id
async function getOrderById(orderId: string) {
  return await fetchDbJsonOrThrow(
    `${DB_API_BASE_URL}/orders/${encodeURIComponent(orderId)}`,
    { method: "GET" },
  );
}

// ✅ create order (ตาม swagger POST /orders)
async function createOrder(payload: any) {
  return await fetchDbJsonOrThrow(`${DB_API_BASE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function Form(): JSX.Element {
  const [projectsState, setProjectsState] = useState<State<Project[]>>({
    status: "loading",
    data: null,
    error: null,
  });

  const [selectedProjectGid, setSelectedProjectGid] = useState<string>("");

  const [formData, setFormData] = useState({
    tax_id: "",
    company: "",
    fullName: "",
    phoneNumber: "",
    email: "",
    lineId: "",
    address: "",
    extra: "",
    jobName: "",
    quantity: "",
    startDate: "",
    endDate: "",
    
  });

  const [files, setFiles] = useState<File[]>([]);
  const [, setResult] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);

  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([]);

  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("ส่งใบสั่งพิมพ์สำเร็จ");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>("");
  const [workType, setWorkType] = useState<string>("");
  const [detailsKey, setDetailsKey] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [createdNotes, setCreatedNotes] = useState<string>("");
  const [workTypes, setWorkTypes] = useState<WorkTypeDoc[]>([]);
  const [workTypesLoading, setWorkTypesLoading] = useState(false);
  const [, setWorkTypesError] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        setWorkTypesLoading(true);
        setWorkTypesError("");
        const json = await fetchDbJsonOrThrow(`${DB_API_BASE_URL}/type-works`, {
          method: "GET",
        });

        const list = Array.isArray(json) ? json : (json?.data ?? []);
        const normalized = (Array.isArray(list) ? list : [])
          .map((x: any) => ({
            _id: String(x?._id ?? x?.id ?? ""),
            name_work: String(
              x?.name_tw ?? x?.name_work ?? x?.name ?? "",
            ).trim(), // ✅ เพิ่ม name_tw
          }))
          .filter((x) => x._id && x.name_work);

        setWorkTypes(normalized);
      } catch (e) {
        setWorkTypesError(e instanceof Error ? e.message : String(e));
        setWorkTypes([]);
      } finally {
        setWorkTypesLoading(false);
      }
    };

    run();
  }, []);

  const resetForm = () => {
    setFormData({
      tax_id: "",
      company: "",
      fullName: "",
      phoneNumber: "",
      email: "",
      lineId: "",
      address: "",
      extra: "",
      jobName: "",
      quantity: "",
      startDate: "",
      endDate: "",
    });

    setSelectedProjectGid("");
    setWorkType("");
    setSubtasks([]);
    setFiles([]);
    setResetKey((prev) => prev + 1);

    setErrors({});
    setFormError("");
    setDetailsKey((prev) => prev + 1);
  };

  // โหลด projects (Asana)
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setProjectsState({ status: "loading", data: null, error: null });

        const res = await fetch(
          `${API_BASE_URL}/projects?workspace=${WORKSPACE_GID}`,
          {
            headers: {
              Accept: "application/json",
              "X-Tunnel-Skip-AntiPhishing-Page": "True",
            },
          },
        );

        const json = await safeReadJson(res);
        if (!res.ok) {
          throw new Error(
            `HTTP ${res.status}\n${JSON.stringify(json, null, 2)}`,
          );
        }

        const list = Array.isArray(json)
          ? (json as Project[])
          : ((json as any)?.data ?? []);
        setProjectsState({ status: "success", data: list, error: null });
      } catch (e) {
        setProjectsState({
          status: "error",
          data: null,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    };

    loadProjects();
  }, []);

  const [searchParams] = useSearchParams();

  // ✅ โหลด order เดิมจาก Mongo (แทน GAS)
  useEffect(() => {
    const orderId = searchParams.get("order_id");
    if (!orderId) return;

    const run = async () => {
      const json = await getOrderById(orderId);

      // คาดหวัง shape: { ok:true, found:true, company:{...}, order:{...} }
      if (!json?.found || !json?.order) return;

      const o = json.order;

      setFormData((prev) => ({
        ...prev,
        tax_id: String(json.company?.tax ?? prev.tax_id),
        company: String(
          json.company?.companyName ?? json.company?.company ?? prev.company,
        ),

        fullName: String(o.customer_name ?? ""),
        phoneNumber: String(o.phone ?? ""),
        email: String(o.email ?? ""),
        lineId: String(o.line ?? ""),
        address: String(o.address ?? ""),
        quantity: String(o.count_work ?? ""),
        startDate: String(o.start_date ?? ""),
        endDate: String(o.end_date ?? ""),
        extra: String(o.detail_work ?? ""),
        jobName: prev.jobName, // ถ้าคุณมี jobName ใน DB ก็ใส่เพิ่มได้
      }));

      // type_work ใน Mongo เป็น id ของโปรเจกต์
      const typeWorkId = String(o.type_work ?? "");
      if (projectsState.status === "success" && typeWorkId) {
        const match = projectsState.data.find((p) => p.gid === typeWorkId);
        if (match) setSelectedProjectGid(match.gid);
      }
    };

    run().catch((e) => console.error(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, projectsState.status]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "startDate" && next.endDate && next.endDate < value) {
        next.endDate = "";
      }
      return next;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};

    if (!formData.company.trim()) e.company = "กรุณากรอกชื่อบริษัท/หน่วยงาน";
    if (!formData.fullName.trim()) e.fullName = "กรุณากรอกชื่อ";
    if (!formData.phoneNumber.trim()) e.phoneNumber = "กรุณากรอกเบอร์โทร";
    if (!formData.email.trim()) e.email = "กรุณากรอกอีเมล";
    if (!formData.address.trim()) e.address = "กรุณากรอกที่อยู่";

    if (!selectedProjectGid) e.project = "กรุณาเลือกประเภทงาน";
    if (!formData.quantity.trim()) e.quantity = "กรุณากรอกจำนวนสั่ง";
    if (!formData.jobName.trim()) e.jobName = "กรุณากรอกชื่องาน";
    if (!formData.startDate.trim()) e.startDate = "กรุณาเลือกวันที่สั่งงาน";
    if (!formData.endDate.trim()) e.endDate = "กรุณาเลือกวันนัดรับงาน";

    setErrors(e);

    if (Object.keys(e).length > 0) {
      setFormError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return false;
    }

    setFormError("");
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setCreating(true);
    setResult("");

    try {
      if (projectsState.status !== "success")
        throw new Error("Projects ยังโหลดไม่เสร็จ");

      const selectedProject = projectsState.data.find(
        (p) => p.gid === selectedProjectGid,
      );
      if (!selectedProject) throw new Error("ไม่พบโปรเจกต์ที่เลือก");

      const formEl = e.currentTarget as HTMLFormElement;
      const fd = new FormData(formEl);

      const getStr = (k: string): string => {
        const v = fd.get(k);
        return typeof v === "string" ? v.trim() : "";
      };

      const getAllStr = (k: string): string[] =>
        fd
          .getAll(k)
          .map((x) => String(x).trim())
          .filter((x) => x.length > 0);

      const checked = (k: string): boolean => fd.get(k) !== null;

      const lines: string[] = [];

      // --- ข้อมูลลูกค้า ---
      if (formData.tax_id.trim())
        lines.push(`TAX ID: ${formData.tax_id.trim()}`);
      if (formData.company.trim())
        lines.push(`ชื่อบริษัท/หน่วยงาน: ${formData.company.trim()}`);
      if (formData.fullName.trim())
        lines.push(`ชื่อ: ${formData.fullName.trim()}`);
      if (workType) lines.push(`ประเภทงาน: ${workType}`);

      if (formData.phoneNumber.trim())
        lines.push(`เบอร์โทร: ${formData.phoneNumber.trim()}`);
      if (formData.email.trim()) lines.push(`อีเมล: ${formData.email.trim()}`);
      if (formData.lineId.trim()) lines.push(`Line: ${formData.lineId.trim()}`);
      if (formData.address.trim())
        lines.push(`ที่อยู่: ${formData.address.trim()}`);

      // --- รายละเอียดงาน ---
      const jobName = getStr("jobName");
      if (jobName) lines.push(`ชื่องาน: ${jobName}`);

      const qty = getStr("quantity");
      if (qty) lines.push(`จำนวนสั่ง: ${qty}`);

      const startDate = getStr("startDate");
      if (startDate) lines.push(`วันเริ่ม: ${startDate}`);

      const endDate = getStr("endDate");
      if (endDate) lines.push(`วันสิ้นสุด: ${endDate}`);

      // --- กระดาษที่ใช้ ---
      const cover = getStr("paper_cover");
      if (cover) lines.push(`หน้าปก: ${cover}`);

      const inside = getStr("paper_inside");
      if (inside) lines.push(`เนื้อใน: ${inside}`);

      const billTypes = getAllStr("billType");
      if (billTypes.length > 0) lines.push(`งานบิล: ${billTypes.join(", ")}`);

      // --- ปะสันสี ---
      const paperColor = getStr("pasansee_paper_color");
      if (paperColor) lines.push(`ปะสันกระดาษ: ${paperColor}`);

      const laxineColor = getStr("pasansee_laxine_color");
      if (laxineColor) lines.push(`ปะสันแล็กซีน: ${laxineColor}`);

      // --- การเข้าเล่ม / ตีปรุ / รันนัมเบอร์ ---
      if (checked("bind_wire_enabled")) {
        const pos = getStr("bind_wire_pos");
        lines.push(pos ? `เย็บลวด: ${pos}` : "เย็บลวด");
      }

      if (checked("bind_press_enabled")) {
        const pos = getStr("bind_press_pos");
        lines.push(pos ? `อัดสัน: ${pos}` : "อัดสัน");
      }

      if (checked("bind_glue")) lines.push("ไสกาว");

      if (checked("bind_fold")) {
        const detail = getStr("bind_fold_detail");
        lines.push(detail ? `พับ: ${detail}` : "พับ");
      }

      if (checked("bind_other")) {
        const details = getStr("bind_other_detail");
        lines.push(details ? `อื่นๆ: ${details}` : "อื่นๆ");
      }

      if (checked("bind_perforate")) {
        const pos = getStr("bind_perforate_pos");
        lines.push(pos ? `ปรุ: ${pos}` : "ปรุ");
      }

     

if (selectedColors.length > 0) {
  lines.push(
    `สีที่ใช้: ${selectedColors.join(", ")}`
  );
}

      // --- รันนัมเบอร์ ---
      if (checked("bind_run_enabled")) {
        const color = getStr("bind_run_color");
        const book = getStr("bind_run_book");

        const range = getStr("bind_run_range");
        const rangeCustom = getStr("bind_run_range_custom");

        const rangeText =
          range === "ยาว"
            ? rangeCustom
              ? `ยาว ${rangeCustom}`
              : "ยาว"
            : range;

        if (color) lines.push(`รันนัมเบอร์ สี/${color}`);
        if (book) lines.push(`เล่มที่ ${book}`);
        if (rangeText) lines.push(`เลขที่ ${rangeText}`);
      }

      // Details.tsx
      const detail = getStr("detail");
      const unit = getStr("unit");
      const size = getStr("size");

      const parts: string[] = [];
      if (detail) parts.push(`ขนาดสำเร็จ: ${detail}${unit ? ` ${unit}` : ""}`);
      if (size) parts.push(`ขนาดตัดกระดาษ: ${size}`);
      if (parts.length) lines.push(parts.join(" | "));

      const count_Detail = getStr("count_Detail");
      if (count_Detail) lines.push(`จำนวนพิมพ์: ${count_Detail}`);

      const Detail_Type = getAllStr("Detail_Type");
      if (Detail_Type.length > 0)
        lines.push(`รูปแบบ: ${Detail_Type.join(", ")}`);

      // ชนิดรูปแบบงาน
      const typeWorks = getAllStr("type_of_work");
      const otherType = getStr("other_type_of_work");
      const finalTypeWorks = typeWorks
        .map((x) =>
          x === "อื่นๆ" ? (otherType ? `อื่นๆ: ${otherType}` : "อื่นๆ") : x,
        )
        .filter((x) => x.length > 0);
      if (finalTypeWorks.length > 0)
        lines.push(`ชนิดรูปแบบงาน: ${finalTypeWorks.join(", ")}`);

      // เครื่องพิมพ์
      const printer = getAllStr("printer");
      if (printer.length > 0) lines.push(`เครื่องพิมพ์: ${printer.join(", ")}`);

  if (formData.extra.trim()) {
  lines.push("");
  lines.push("📌 ข้อมูลเพิ่มเติม");
  lines.push(formData.extra.trim());
}

      const notes = lines.join("\n");
      setCreatedNotes(notes);

      // ✅ 1) สร้าง Asana งานหลัก
      const createMainPayload = {
        data: {
          name: getStr("jobName"),
          notes,
          projects: [selectedProjectGid],
          start_on: getStr("startDate"),
          due_on: getStr("endDate"),
        },
      };

      const mainJson = await fetchJsonOrThrow(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "True",
        },
        body: JSON.stringify(createMainPayload),
      });

      const taskGid = getTaskGid(mainJson);
      if (!taskGid)
        throw new Error(
          "สร้าง Task แล้ว แต่ไม่ได้ taskGid (response shape ไม่ตรง)",
        );

      const mainTaskInfoJson = await fetchJsonOrThrow(
        `${API_BASE_URL}/tasks/${taskGid}?opt_fields=gid,name,permalink_url`,
        {
          headers: {
            Accept: "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "True",
          },
        },
      );
      const mainTaskInfo = normalizeAsanaTask(mainTaskInfoJson);

      // ✅ 2) อัปโหลดไฟล์แนบ Asana + เก็บลิงก์
      const fileLinks: FileLink[] = [];

      if (files.length > 0) {
        for (const file of files) {
          const form = new FormData();
          form.append("file", file);

          const upRes = await fetch(
            `${API_BASE_URL}/tasks/${taskGid}/attachments`,
            {
              method: "POST",
              body: form,
            },
          );

          const upJson = await safeReadJson(upRes);
          if (!upRes.ok) {
            fileLinks.push({ name: file.name, url: "" });
            continue;
          }

          const att = parseUploadAttachment(upJson);
          if (!att?.gid) {
            fileLinks.push({ name: file.name, url: "" });
            continue;
          }

          const metaJson = await fetchJsonOrThrow(
            `${API_BASE_URL}/attachments/${att.gid}?opt_fields=name,permanent_url,download_url`,
            {
              headers: {
                Accept: "application/json",
                "X-Tunnel-Skip-AntiPhishing-Page": "True",
              },
            },
          );
          const meta = parseUploadAttachment(metaJson);

       fileLinks.push({
  name: meta?.name ?? file.name,
  url: meta?.download_url ?? meta?.permanent_url ?? "",
});
        }
      }

      // อัปเดต notes เพิ่มไฟล์แนบใน Asana งานหลัก
      if (fileLinks.length > 0) {
        const linksText =
          "\n\nไฟล์แนบ:\n" +
          fileLinks.map((f) => `- ${f.name}: ${f.url || "-"}`).join("\n");

        await fetchJsonOrThrow(`${API_BASE_URL}/tasks/${taskGid}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "True",
          },
          body: JSON.stringify({ data: { notes: notes + linksText } }),
        });
      }

      // ✅ 3) สร้าง subtasks (ของคุณตอนนี้ยังคงเป็น subtask จริง)
      const otherTasks: AsanaTaskMini[] = [];
      const mainRef = mainTaskInfo?.permalink_url
        ? `\n\nอ้างอิงงานหลัก: ${mainTaskInfo.permalink_url}`
        : `\n\nอ้างอิงงานหลัก (GID): ${taskGid}`;

      const attachText =
        fileLinks.length > 0
          ? "\n\nไฟล์แนบ (จากงานหลัก):\n" +
            fileLinks.map((f) => `- ${f.name}: ${f.url || "-"}`).join("\n")
          : "";

      for (const row of subtasks ?? []) {
        const pgid = String(row.projectGid ?? "").trim();
        const nm = String(row.name ?? "").trim();
        if (!pgid) continue;

        const taskName = nm || getStr("jobName");

        const createOtherPayload = {
          data: {
            name: taskName,
            notes: notes + mainRef + attachText,
            projects: [pgid],
            start_on: getStr("startDate"),
            due_on: getStr("endDate"),
          },
        };

        try {
          const otherCreateJson = await fetchJsonOrThrow(
            `${API_BASE_URL}/tasks/${taskGid}/subtasks`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-Tunnel-Skip-AntiPhishing-Page": "True",
              },
              body: JSON.stringify(createOtherPayload),
            },
          );

          const otherGid = getTaskGid(otherCreateJson);
          if (!otherGid) continue;

          const otherInfoJson = await fetchJsonOrThrow(
            `${API_BASE_URL}/tasks/${otherGid}?opt_fields=gid,name,permalink_url`,
            {
              headers: {
                Accept: "application/json",
                "X-Tunnel-Skip-AntiPhishing-Page": "True",
              },
            },
          );

          const otherInfo = normalizeAsanaTask(otherInfoJson);
          if (otherInfo) otherTasks.push(otherInfo);
        } catch (err) {
          console.error("create subtask failed:", err);
        }
      }

      // ✅ 4) บันทึกลง MongoDB (แทน GAS saveOrder)
      // 4.1 upsert/create company
      const compJson = await upsertCompany({
        company: formData.company.trim(),
        tax: formData.tax_id.trim() ? formData.tax_id.trim() : undefined,
      });

      const companyId = pickId(compJson);
      if (!companyId) throw new Error("ไม่พบ id_company ที่ได้จาก /companies");

     
     const fileText =
  fileLinks.length > 0
    ? JSON.stringify(fileLinks)
    : "";

      await createOrder({
        id_company: companyId,
        customer_name: formData.fullName,
        phone: formData.phoneNumber,
        email: formData.email,
        line: formData.lineId,
        address: formData.address,
        start_date: formData.startDate,
        end_date: formData.endDate,
        type_work: selectedProjectGid,
        count_work: Number(formData.quantity || 0),
        detail_work: notes, // ✅ เก็บ notes ทั้งหมดลง detail_work เลย (คอนเซปเดิม)
        file: fileText, // ✅ ตาม swagger เป็น string
        // ถ้าคุณอยากเก็บ task ลง DB ด้วยจริง ๆ ต้องให้ backend รองรับ field เพิ่ม
        // mainTask: mainTaskInfo ?? { gid: taskGid },
        // otherTasks,
      });

      setSuccessMessage("ส่งใบสั่งพิมพ์สำเร็จ");
      setSuccessOpen(true);
      setResult("✅ สำเร็จ");
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : String(e2);
      setResult("❌ Error\n\n" + msg);
      setFormError(msg);
    } finally {
      setCreating(false);
    }
  };

  const showPaperUsed = workType === "สมุดหนังสือที่มีการเข้าเล่ม" || workType === "อื่นๆ";
  const showPasansee =
    workType === "งานเอกสารธุรการ" || workType === "สมุดหนังสือที่มีการเข้าเล่ม" || workType === "อื่นๆ";
  const showBinding =
    workType === "งานเอกสารธุรการ" || workType === "สมุดหนังสือที่มีการเข้าเล่ม" || workType === "อื่นๆ";


  return (
    <>
      <header className="mx-auto max-w-3xl px-4 py-10  text-4xl">
        <h2 className="text-center">ใบสั่งพิมพ์งาน</h2>
      </header>

      <section>
        {/* {projectsState.status === "loading" && (
            <div>
              <span className="loading loading-spinner loading-xl"></span>
            </div>
          )} */}

        {/* {projectsState.status === "error" && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 whitespace-pre-wrap">
              {projectsState.error}
            </div>
          )} */}

        {/* {projectsState.status === "success" && ( */}
        <form
          id="order-form"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          noValidate
          className="  px-2 sm:px-6"
        >
          {/* {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-1 text-sm text-rose-700">
                  {formError}
                </div>
              )} */}

          <div className="mx-4 mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* HEADER */}
            <div className="px-6 pt-6">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-slate-800">
                <User className="text-blue-600 w-5 h-5" />
                ข้อมูลลูกค้า
              </h2>
              <div className="mt-4 border-b border-slate-200" />
            </div>

            {/* FORM GRID */}
            <div className="px-6 pb-2 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* tax */}
              <div className="space-y-1">
                <label className="text-sm  text-slate-700">TAX</label>
                <input
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleChange}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none transition border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                />
              </div>
              {/* COMPANY */}
              <div className="space-y-1">
                <label className="text-sm  text-slate-700">
                  ชื่อบริษัท/หน่วยงาน <span className="text-rose-600">*</span>
                </label>
                <input
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className={`w-full rounded-xl px-3 py-2 text-sm outline-none transition
                ${
                  errors.company
                    ? "border border-rose-500 focus:ring-2 focus:ring-rose-200"
                    : "border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                }`}
                />
                {errors.company && (
                  <p className="text-xs text-rose-600">{errors.company}</p>
                )}
              </div>

              {/* FULL NAME */}
              <div className="space-y-1">
                <label className="text-sm  text-slate-700">
                  ลูกค้า <span className="text-rose-600">*</span>
                </label>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full rounded-xl px-3 py-2 text-sm outline-none transition
                ${
                  errors.fullName
                    ? "border border-rose-500 focus:ring-2 focus:ring-rose-200"
                    : "border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                }`}
                />
                {errors.fullName && (
                  <p className="text-xs text-rose-600">{errors.fullName}</p>
                )}
              </div>

              {/* PHONE */}
              <div className="space-y-1">
                <label className="text-sm  text-slate-700">
                  โทร <span className="text-rose-600">*</span>
                </label>
                <input
                  name="phoneNumber"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`w-full rounded-xl px-3 py-2 text-sm outline-none transition
                  ${
                    errors.phoneNumber
                      ? "border border-rose-500 focus:ring-2 focus:ring-rose-200"
                      : "border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                  }`}
                />
                {errors.phoneNumber && (
                  <p className="text-xs text-rose-600">{errors.phoneNumber}</p>
                )}
              </div>
            </div>
            {/* แถวที่ 2 */}
            <div className="px-6 pb-4 pt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
              
                {/* EMAIL */}
                <div className="space-y-1">
                  <label className="text-sm  text-slate-700">
                    อีเมล <span className="text-rose-600">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full rounded-xl px-3 py-2 text-sm outline-none transition
                    ${
                      errors.email
                        ? "border border-rose-500 focus:ring-2 focus:ring-rose-200"
                        : "border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-600">{errors.email}</p>
                  )}
                </div>

                {/* LINE */}
                <div className="space-y-1">
                  <label className="text-sm  text-slate-700">Line</label>
                  <input
                    name="lineId"
                    value={formData.lineId}
                    onChange={handleChange}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none transition border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

            
               
                {/* PROJECT */}
                <div className="space-y-1">
                  <label className="text-sm  text-slate-800">
                    Project <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={selectedProjectGid}
                    onChange={(e) => setSelectedProjectGid(e.target.value)}
                    className={[
                      " w-full rounded-xl border bg-white px-3 py-2.5 text-base sm:text-sm outline-none",
                      errors.project
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-slate-900",
                    ].join(" ")}
                  >
                    <option value="" disabled>
                      เลือกโปรเจกต์
                    </option>
                    {projectsState.data?.map((p) => (
                      <option key={p.gid} value={p.gid}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {errors.project && (
                    <p className="text-xs text-rose-600">{errors.project}</p>
                  )}
                </div>
                 {/* 🔹 RIGHT SIDE (ADDRESS) */}
              <div className="space-y-1">
                <label className="text-sm  text-slate-800">
                  ที่อยู่ <span className="text-rose-600">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={6}
                  className={`w-full rounded-2xl px-3 py-2 text-sm outline-none resize-none transition
                  ${
                    errors.address
                      ? "border border-rose-500 focus:ring-2 focus:ring-rose-200"
                      : "border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                  }`}
                />
                {errors.address && (
                  <p className="text-xs text-rose-600">{errors.address}</p>
                )}
              </div>
              </div>

             
            </div>
         
          <div className="mx-4 mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* HEADER */}
            <div className="px-6 pt-6">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-slate-800">
                <ReceiptText className="text-blue-600 w-5 h-5" />
                รายละเอียดงาน
              </h2>
              <div className="mt-4 border-b border-slate-200" />

              <div className="px-6 pb-2 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* วันที่สั่งงาน */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    วันที่สั่งงาน <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={[
                      "w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition",
                      "focus:ring-2 focus:ring-indigo-100",
                      errors.startDate
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-indigo-600",
                    ].join(" ")}
                  />
                  {errors.startDate && (
                    <p className="text-xs text-rose-600">{errors.startDate}</p>
                  )}
                </div>

                {/* วันที่รับงาน */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    วันที่รับงาน <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate || undefined}
                    className={[
                      "w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition",
                      "focus:ring-2 focus:ring-indigo-100",
                      errors.endDate
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-indigo-600",
                    ].join(" ")}
                  />
                  {errors.endDate && (
                    <p className="text-xs text-rose-600">{errors.endDate}</p>
                  )}
                </div>

                {/* ชื่องาน */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    ชื่องาน <span className="text-rose-600">*</span>
                  </label>
                  <input
                    name="jobName"
                    value={formData.jobName}
                    onChange={handleChange}
                    className={[
                      "w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition",
                      "focus:ring-2 focus:ring-indigo-100",
                      errors.jobName
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-indigo-600",
                    ].join(" ")}
                  />
                  {errors.jobName && (
                    <p className="text-xs text-rose-600">{errors.jobName}</p>
                  )}
                </div>

                {/* จำนวนสั่ง */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    จำนวนสั่ง <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min={1}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-100 ${
                      errors.quantity
                        ? "border-rose-500"
                        : "border-slate-300 focus:border-indigo-600"
                    }`}
                  />
                  {errors.quantity && (
                    <p className="text-xs text-rose-600">{errors.quantity}</p>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                  <div className="p-6">
                    <Subtask
                      projects={
                        projectsState.status === "success"
                          ? projectsState.data
                          : []
                      }
                      value={subtasks}
                      onChange={setSubtasks}
                      disabled={creating || projectsState.status !== "success"}
                    />
                  </div>
                  <div className="p-6">
                    <Details
                      key={detailsKey}
                      files={files}
                      setFiles={setFiles}
                    />
                  </div>
                  <div className="p-6">
                    <Detail_Type
                      key={detailsKey}
                      files={files}
                      setFiles={setFiles}
                    />
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
          

          <div className="space-y-4">
            {/* ===== ตัวเลือกบนหัว ===== */}
            <div className="flex flex-wrap gap-3">
              {workTypes.map((t) => {
                const active = workType === t.name_work;

                return (
                  <button
                    key={t._id}
                    type="button"
                    onClick={() => setWorkType(t.name_work)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition
            ${
              active
                ? "border-2 border-slate-900 bg-slate-100"
                : "border border-slate-300 bg-white hover:border-slate-400"
            }
              `}
                  >
                    {t.name_work}
                  </button>
                );
              })}
                </div>

                {/* ===== กล่องข้อมูล ===== */}
                <div
                  className={`mx-4 mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden
                
                `}
                        >
              <div className="px-6 pt-6">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-slate-800">
                <ReceiptText className="text-blue-600 w-5 h-5" />
                รายละเอียดงานเพิ่มเติม
                </h2>
                <div className="mt-4 border-b border-slate-200" />
              </div>
              <div className="mx-10 grid ">
                  <div>
                    <Color
                      selected={selectedColors}
                      onChange={setSelectedColors}
                    />
                  </div>
                <div>
                     {showPaperUsed && <Paper_used />}
                </div>
                <div>
                    {showPasansee && <Pasansee />}
                </div>
                <div>
                    {showBinding && <Binding />}
                </div>
        
                  <div key={`work-${resetKey}`}>
                    <TypeOfWork />
                  </div>

                  <div key={`printer-${resetKey}`}>
                    <Printer />
                    </div>
                  
                  <div>
                    <AdditionalDetails
  value={formData.extra}
  onChange={(val) =>
    setFormData((prev) => ({ ...prev, extra: val }))
  }
/>
                  </div>
                  

              </div>
                

            </div>
          </div>
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 pb-10 disabled:opacity-50 disabled:cursor-not-allowed">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creating ? "กำลังส่ง..." : "ส่งใบสั่งงาน"}
              </button>
            </div>

            {successOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                onClick={() => setSuccessOpen(false)}
              >
                <div
                  className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <div className="text-lg font-semibold text-slate-900">
                    สำเร็จ
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    {successMessage}
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      onClick={() => {
                        setSuccessOpen(false);
                        resetForm();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      ตกลง
                    </button>

                    <PDFDownloadButton
                      formId="order-form"
                      formData={formData}
                      notes={createdNotes}
                      fileName="order.pdf"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
        {/* )} */}
      </section>

      <div className="min-h-screen text-slate-900">
       

        {/* <header className="mx-auto max-w-3xl px-4 py-10 text-center text-4xl">
          <h2>ใบสั่งพิมพ์งาน</h2>
        </header>

        <div className="mx-auto max-w-2xl px-4 pb-6">
          <SearchBox />
        </div>

        <section className="min-h-[60vh] flex items-center justify-center pb-16">
          {projectsState.status === "loading" && (
            <div>
              <span className="loading loading-spinner loading-xl"></span>
            </div>
          )}

          {projectsState.status === "error" && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 whitespace-pre-wrap">
              {projectsState.error}
            </div>
          )}

          {projectsState.status === "success" && (
            <form
              id="order-form"
              onSubmit={handleSubmit}
              encType="multipart/form-data"
              noValidate
              className="mx-auto w-full max-w-3xl space-y-6 px-4 sm:px-6"
            >
              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {formError}
                </div>
              )}

              <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border border-slate-200 rounded-2xl ">
                  <div className="grid grid-cols-1 md:grid-cols-2 justify-between px-6 py-5">
                    <div>
                      <h2 className="px-6 pt-6 text-lg sm:text-xl font-semibold flex items-center">
                        ข้อมูลลูกค้า
                      </h2>
                    </div>
                    <div className="flex items-center">
                      <label>tax</label>
                      <input
                        name="tax_id"
                        value={formData.tax_id}
                        onChange={handleChange}
                        className="mt-2 ml-1 w-full rounded-lg border border-slate-300 px-2 py-1 text-base sm:text-sm outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid px-6 py-5">
                    <label>
                      ชื่อบริษัท/หน่วยงาน{" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <input
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className={`mt-2 w-full rounded-xl px-3 py-2.5 text-base sm:text-sm outline-none
                        ${
                          errors.fullName
                            ? "border border-rose-500 focus:border-rose-600"
                            : "border border-slate-300 focus:border-slate-900"
                        }`}
                    />
                    {errors.company && (
                      <p className="mt-1 text-xs text-rose-600">
                        {errors.company}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-5">
                    <div>
                      <label className="text-base sm:text-sm font-medium text-slate-800">
                        ลูกค้า <span className="text-red-600">*</span>
                      </label>
                      <input
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className={`mt-2 w-full rounded-xl px-3 py-2.5 text-base sm:text-sm outline-none
                          ${
                            errors.fullName
                              ? "border border-rose-500 focus:border-rose-600"
                              : "border border-slate-300 focus:border-slate-900"
                          }`}
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-base sm:text-sm font-medium text-slate-800">
                        โทร <span className="text-red-600">*</span>
                      </label>
                      <input
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onChange={handleChange}
                        className={`mt-2 w-full rounded-xl px-3 py-2.5 text-base sm:text-sm outline-none
                          ${
                            errors.fullName
                              ? "border border-rose-500 focus:border-rose-600"
                              : "border border-slate-300 focus:border-slate-900"
                          }`}
                      />
                      {errors.phoneNumber && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.phoneNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-base sm:text-sm font-medium text-slate-800">
                        อีเมล <span className="text-red-600">*</span>
                      </label>
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`mt-2 w-full rounded-xl px-3 py-2.5 text-base sm:text-sm outline-none
                          ${
                            errors.fullName
                              ? "border border-rose-500 focus:border-rose-600"
                              : "border border-slate-300 focus:border-slate-900"
                          }`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-base sm:text-sm font-medium text-slate-800">
                        Line
                      </label>
                      <input
                        name="lineId"
                        value={formData.lineId}
                        onChange={handleChange}
                        className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base sm:text-sm outline-none focus:border-slate-900"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-base sm:text-sm font-medium text-slate-800">
                        ที่อยู่ <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={3}
                        className={`mt-2 w-full rounded-xl px-3 py-2.5 text-base sm:text-sm outline-none resize-none
                          ${
                            errors.fullName
                              ? "border border-rose-500 focus:border-rose-600"
                              : "border border-slate-300 focus:border-slate-900"
                          }`}
                      />
                      {errors.address && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ">
                <div className="border border-slate-200 rounded-2xl px-6 py-5">
                  <h2 className=" pt-6 text-lg sm:text-xl font-semibold">
                    รายละเอียดงาน
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-2 gap-6 px-6 py-5">
                    <div>
                      <label>
                        วันที่สั่งงาน <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className={[
                          "mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-base sm:text-sm outline-none",
                          errors.startDate
                            ? "border-rose-400 focus:border-rose-500"
                            : "border-slate-300 focus:border-slate-900",
                        ].join(" ")}
                      />
                      {errors.startDate && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.startDate}
                        </p>
                      )}
                    </div>

                    <div>
                      <label>
                        วันที่รับงาน <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        min={formData.startDate || undefined}
                        className={[
                          "mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-base sm:text-sm outline-none",
                          errors.endDate
                            ? "border-rose-400 focus:border-rose-500"
                            : "border-slate-300 focus:border-slate-900",
                        ].join(" ")}
                      />
                      {errors.endDate && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.endDate}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                       

                      <div>
                        <label>
                          จำนวนสั่ง <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleChange}
                          min={1}
                          required
                          className={`mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-base sm:text-sm outline-none focus:border-slate-900 ${
                            errors.quantity
                              ? "border-rose-500"
                              : "border-slate-300"
                          }`}
                        />
                        {errors.quantity && (
                          <p className="mt-1 text-xs text-rose-600">
                            {errors.quantity}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label>
                        ชื่องาน <span className="text-red-600">*</span>
                      </label>
                      <input
                        name="jobName"
                        value={formData.jobName}
                        onChange={handleChange}
                        className={[
                          "mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-base sm:text-sm outline-none",
                          errors.jobName
                            ? "border-rose-400 focus:border-rose-500"
                            : "border-slate-300 focus:border-slate-900",
                        ].join(" ")}
                      />
                      {errors.jobName && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.jobName}
                        </p>
                      )}
                    </div>

                    <div className="text-sm font-medium text-slate-800">
                      <label>ประเภทงาน</label>

                      {!workTypesLoading && workTypes.length === 0 && (
                        <option value="" disabled>
                          ไม่มีประเภทงานในระบบ
                        </option>
                      )}

                      <select
                        value={workType}
                        onChange={(e) => setWorkType(e.target.value)}
                        disabled={workTypesLoading || workTypes.length === 0}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 disabled:opacity-60"
                      >
                        <option value="" disabled>
                          {workTypesLoading ? "กำลังโหลด..." : "เลือกประเภทงาน"}
                        </option>

                        {workTypes.map((t) => (
                          <option key={t._id} value={t.name_work}>
                            {t.name_work}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Subtask
                    projects={
                      projectsState.status === "success"
                        ? projectsState.data
                        : []
                    }
                    value={subtasks}
                    onChange={setSubtasks}
                    disabled={creating || projectsState.status !== "success"}
                  />

                  <hr className="my-6 border-slate-200" />

                  {showPaperUsed && <Paper_used />}
                  {showPasansee && <Pasansee />}
                  {showBinding && <Binding />}

                  <Details key={detailsKey} files={files} setFiles={setFiles} />

                  <div key={`work-${resetKey}`}>
                    <TypeOfWork />
                  </div>

                  <div key={`printer-${resetKey}`}>
                    <Printer />
                  </div>
                </div>
              </div>

              <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 pb-10 disabled:opacity-50 disabled:cursor-not-allowed">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creating ? "กำลังส่ง..." : "ส่งใบสั่งงาน"}
                  </button>
                </div>

                {successOpen && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setSuccessOpen(false)}
                  >
                    <div
                      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      <div className="text-lg font-semibold text-slate-900">
                        สำเร็จ
                      </div>
                      <div className="mt-2 text-sm text-slate-700">
                        {successMessage}
                      </div>

                      <div className="mt-6 flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                          onClick={() => {
                            setSuccessOpen(false);
                            resetForm();
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          ตกลง
                        </button>

                        <PDFDownloadButton
                          formId="order-form"
                          formData={formData}
                          notes={createdNotes}
                          fileName="order.pdf"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </section> */}
      </div>
    </>
  );
}

export default Form;
