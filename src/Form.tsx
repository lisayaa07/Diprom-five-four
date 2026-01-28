import React, { useEffect, useState, type FormEvent, type JSX } from "react";
import Paper_used from "./components/Paper_used";
import Pasansee from "./components/Pasansee";
import Binding from "./components/Binding";
import Details from "./components/Details";
import Subtask, { type SubtaskDraft } from "./components/Subtask";
import TypeOfWork from "./components/TypeOfWork";
import Printer from "./components/Printer";
import SearchBox from "./components/Search_Box";
import { useSearchParams } from "react-router-dom";

type Project = { gid: string; name: string; resource_type?: string };
type State<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: string };

const WORKSPACE_GID = "1212854074325957";
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
};

const parseUploadAttachment = (j: unknown): AsanaAttachment | null => {
  if (!j || typeof j !== "object") return null;

  // ✅ รองรับทั้ง {data:{...}} และ {...}
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

    jobName: "", // ชื่องาน -> ไปเป็น task name
    quantity: "", // จำนวนสั่ง (เก็บไว้ใส่ notes)
    startDate: "", // วันเริ่ม (date: YYYY-MM-DD)
    endDate: "", // วันสิ้นสุด (date: YYYY-MM-DD)
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


  // โหลด projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setProjectsState({ status: "loading", data: null, error: null });

        const res = await fetch(`/api/projects?workspace=${WORKSPACE_GID}`, {
          headers: {
            Accept: "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "True",
          },
        });

        const text = await res.text();
        const json = JSON.parse(text);

        if (!res.ok)
          throw new Error(
            `HTTP ${res.status}\n${JSON.stringify(json, null, 2)}`,
          );

        const list = Array.isArray(json)
          ? (json as Project[])
          : ((json as any)?.data ?? []);
        setProjectsState({ status: "success", data: list, error: null });

        // if (list.length > 0)
        //   setSelectedProjectGid((prev) => prev || list[0].gid);
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

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    if (!orderId) return;

    const run = async () => {
      const GAS_URL =
        "https://script.google.com/macros/s/AKfycbxalbLbNad6Ni2EmsbbuYqj4uCuJGoOQ1kEJP6ky4kjWKXVnmhrW6Dci3WgrbpKASvy/exec";

      const url = new URL(GAS_URL);
      url.searchParams.set("action", "getOrderById");
      url.searchParams.set("order_id", orderId);

      const res = await fetch(url.toString());
      const text = await res.text();
      const json = JSON.parse(text) as {
        ok: boolean;
        found?: boolean;
        user?: { tax?: string; companyName?: string } | null;
        order?: {
          customerName?: string;
          phone?: string;
          email?: string;
          line?: string;
          address?: string;
          startDate?: string;
          endDate?: string;
          projectName?: string;
          quantity?: string;
          notes?: string;
        };
        error?: string;
      };

      if (!res.ok) throw new Error(`GAS HTTP ${res.status}\n${text}`);
      if (!json.ok) throw new Error(json.error || "GAS ok:false");
      if (!json.found || !json.order) return;

      // เติมข้อมูลลง formData
      setFormData((prev) => ({
        ...prev,
        tax_id: json.user?.tax ?? prev.tax_id,
        company: json.user?.companyName ?? prev.company,
        fullName: String(json.order?.customerName ?? ""),
        phoneNumber: String(json.order?.phone ?? ""),
        email: String(json.order?.email ?? ""),
        lineId: String(json.order?.line ?? ""),
        address: String(json.order?.address ?? ""),
        jobName: String(json.order?.projectName ?? prev.jobName), // ถ้าคุณอยากเอาชื่องานเก่า แนะนำเก็บเพิ่มในชีทภายหลัง
        quantity: String(json.order?.quantity ?? ""),
        startDate: String(json.order?.startDate ?? ""),
        endDate: String(json.order?.endDate ?? ""),
        extra: "",
      }));

      // ตั้ง selectedProject จาก "ชื่อโปรเจกต์" (เพราะในชีทเราเก็บเป็นชื่อ)
      const projectName = String(json.order.projectName ?? "");
      if (projectsState.status === "success" && projectName) {
        const match = projectsState.data.find((p) => p.name === projectName);
        if (match) setSelectedProjectGid(match.gid);
      }
    };

    run().catch((e) => {
      console.error(e);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, projectsState.status]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      // ถ้าเปลี่ยน startDate แล้ว endDate กลายเป็น "ก่อน" startDate → เคลียร์ endDate
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

      // --- ข้อมูลลูกค้า ( ---
      if (formData.tax_id.trim())
        lines.push(`TAX ID: ${formData.tax_id.trim()}`);
      if (formData.company.trim())
        lines.push(`ชื่อบริษัท/หน่วยงาน: ${formData.company.trim()}`);
      if (formData.fullName.trim())
        lines.push(`ชื่อ: ${formData.fullName.trim()}`);
      if (selectedProject?.name) lines.push(`ประเภท: ${selectedProject.name}`);
      if (formData.phoneNumber.trim())
        lines.push(`เบอร์โทร: ${formData.phoneNumber.trim()}`);
      if (formData.email.trim()) lines.push(`อีเมล: ${formData.email.trim()}`);
      if (formData.lineId.trim()) lines.push(`Line: ${formData.lineId.trim()}`);
      if (formData.address.trim())
        lines.push(`ที่อยู่: ${formData.address.trim()}`);

      // --- รายละเอียดงาน (แสดงเฉพาะที่กรอก/เลือก) ---
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

      // --- ปะสันสี (แสดงเฉพาะที่เลือก/กรอก) ---
      const paperColor = getStr("pasansee_paper_color");
      if (paperColor) lines.push(`ปะสันกระดาษ: ${paperColor}`);

      const laxineColor = getStr("pasansee_laxine_color");
      if (laxineColor) lines.push(`ปะสันแล็กซีน: ${laxineColor}`);

      // --- การเข้าเล่ม / ตีปรุ / รันนัมเบอร์ (แสดงเฉพาะที่เลือก/กรอก) ---
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
        const detail = getStr("bind_other_detail");
        lines.push(detail ? `อื่นๆ: ${detail}` : "อื่นๆ");
      }

      if (checked("bind_perforate")) {
        const pos = getStr("bind_perforate_pos");
        lines.push(pos ? `ปรุ: ${pos}` : "ปรุ");
      }

      // เพิ่มเติม (ของเดิม)
      if (formData.extra.trim())
        lines.push(`เพิ่มเติม: ${formData.extra.trim()}`);

      // --- รันนัมเบอร์ (แสดงเฉพาะที่เลือก/กรอก) ---

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

      // ดึงค่าจาก Details.tsx
      const detail = getStr("detail");
      const unit = getStr("unit");
      const size = getStr("size");

      //รายละเอียดงาน
      const parts: string[] = [];
      if (detail) parts.push(`ขนาดสำเร็จ: ${detail}${unit ? ` ${unit}` : ""}`);
      if (size) parts.push(`ขนาดตัดกระดาษ: ${size}`);
      if (parts.length) lines.push(parts.join(" | "));

      const Detail_Type = getAllStr("Detail_Type");
      if (Detail_Type.length > 0)
        lines.push(`รูปแบบ: ${Detail_Type.join(", ")}`);

      // ชนิดรูปแบบงาน
      const typeWorks = getAllStr("type_of_work"); // ได้หลายค่า
      const otherType = getStr("other_type_of_work");
      const finalTypeWorks = typeWorks
        .map((x) =>
          x === "อื่นๆ" ? (otherType ? `อื่นๆ: ${otherType}` : "อื่นๆ") : x,
        )
        .filter((x) => x.length > 0);

      if (finalTypeWorks.length > 0) {
        lines.push(`ชนิดรูปแบบงาน: ${finalTypeWorks.join(", ")}`);
      }

      //เครื่องพิมพ์
      const printer = getAllStr("printer");
      const finalprinter = printer;
      if (finalprinter.length > 0) {
        lines.push(`เครื่องพิมพ์: ${finalprinter.join(", ")}`);
      }

      const notes = lines.join("\n");

      const payload = {
        data: {
          name: getStr("jobName"),
          notes, // description
          projects: [selectedProjectGid],
          start_on: getStr("startDate"),
          due_on: getStr("endDate"),
        },
      };

      const res = await fetch(`/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "True",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const json = JSON.parse(text);

      if (!res.ok) {
        throw new Error(
          `POST /tasks failed (HTTP ${res.status})\n${JSON.stringify(json, null, 2)}`,
        );
      }

      const taskGid = getTaskGid(json);
      const fileLinks: FileLink[] = [];

      setSuccessMessage("ส่งใบสั่งพิมพ์สำเร็จ");
      setSuccessOpen(true);

      if (files.length > 0) {
        for (const file of files) {
          const form = new FormData();
          form.append("file", file);

          const up = await fetch(`/api/tasks/${taskGid}/attachments`, {
            method: "POST",
            body: form,
          });

          const upText = await up.text();
          const upJson = JSON.parse(upText);

          const att = parseUploadAttachment(upJson); // ต้องได้ gid + name
          if (!att?.gid) {
            fileLinks.push({ name: file.name, url: "" });
            continue;
          }

          // ✅ ดึง permanent_url อีกรอบ (ต้องมี API proxy ของคุณ)
          const metaRes = await fetch(
            `/api/attachments/${att.gid}?opt_fields=name,permanent_url`,
          );
          if (!metaRes.ok) {
            fileLinks.push({ name: att.name ?? file.name, url: "" });
            continue;
          }
          const metaJson = await metaRes.json();
          const meta = parseUploadAttachment(metaJson);

          fileLinks.push({
            name: meta?.name ?? att.name ?? file.name,
            url: meta?.permanent_url ?? "",
          });
        }
      }

      // 2) Save ลง Google Sheet (DB) หลัง upload เสร็จ
      const GAS_URL =
        "https://script.google.com/macros/s/AKfycbxalbLbNad6Ni2EmsbbuYqj4uCuJGoOQ1kEJP6ky4kjWKXVnmhrW6Dci3WgrbpKASvy/exec";

      const gasRes = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // ✅ กัน preflight
        body: JSON.stringify({
          action: "saveOrder",
          payload: {
            user: {
              tax: formData.tax_id,
              companyName: formData.company,
            },
            order: {
              customerName: formData.fullName,
              phone: formData.phoneNumber,
              email: formData.email,
              line: formData.lineId,
              address: formData.address,
              startDate: formData.startDate,
              endDate: formData.endDate,
              projectName: selectedProject?.name ?? "",
              quantity: formData.quantity,
              notes,
              files: JSON.stringify(fileLinks), // ✅ เก็บเป็น JSON string
            },
          },
        }),
      });

      const gasText = await gasRes.text();
      let gasJson: unknown;
      try {
        gasJson = JSON.parse(gasText);
      } catch {
        gasJson = { raw: gasText };
      }

      if (!gasRes.ok) {
        throw new Error(`GAS HTTP ${gasRes.status}\n${gasText}`);
      }

      if (
        typeof gasJson === "object" &&
        gasJson !== null &&
        "ok" in gasJson &&
        (gasJson as { ok: boolean }).ok === false
      ) {
        throw new Error(`GAS ok:false\n${JSON.stringify(gasJson, null, 2)}`);
      }

      // ✅ ตอนนี้ค่อยไปทำ subtasks ต่อได้ (ไม่ return กลางทาง)

      // (ถ้าคุณอยาก setResult โชว์ด้วย ทำท้ายสุดหลังทำ subtasks เสร็จ)
      // setResult("✅ ...");

      for (const s of subtasks) {
        const name = s.name.trim();
        if (!name) continue;

        // สร้าง subtask ใต้ task แม่
        const subRes = await fetch(`/api/tasks/${taskGid}/subtasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "True",
          },
          body: JSON.stringify({ data: { name } }),
        });

        const subText = await subRes.text();
        const subJson = JSON.parse(subText) as {
          data?: { gid?: string };
          gid?: string;
        };

        if (!subRes.ok) {
          throw new Error(
            `POST /tasks/${taskGid}/subtasks failed (HTTP ${subRes.status})\n${JSON.stringify(subJson, null, 2)}`,
          );
        }

        const subGid = subJson.data?.gid || subJson.gid;
        if (!subGid) throw new Error("สร้าง subtask สำเร็จแต่หา gid ไม่เจอ");

        if (s.projectGid) {
          const addRes = await fetch(`/api/tasks/${subGid}/addProject`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "X-Tunnel-Skip-AntiPhishing-Page": "True",
            },
            body: JSON.stringify({ project: s.projectGid }),
          });

          if (!addRes.ok) {
            const addText = await addRes.text();
            throw new Error(
              `addProject failed (HTTP ${addRes.status})\n${addText}`,
            );
          }
        }
      }

      // ถ้าไม่มีไฟล์ ก็แสดงผลสร้าง task อย่างเดียว
      setResult("✅ สร้าง Task สำเร็จ\n\n" + JSON.stringify(json, null, 2));
    } catch (e) {
      setResult("❌ Error\n\n" + (e instanceof Error ? e.message : String(e)));
    } finally {
      setCreating(false);
    }
  };
  const showPaperUsed = workType === "หนังสือ" || workType === "อื่นๆ";
  const showPasansee = workType === "ฏีกา" || workType === "หนังสือ" || workType === "อื่นๆ";
  const showBinding  = workType === "ฏีกา" || workType === "หนังสือ" || workType === "อื่นๆ";
  


  return (
    <>
      <div className="min-h-screen text-slate-900">
        <header className="mx-auto max-w-3xl px-4 py-10 text-center text-4xl">
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
                       className={[
                            "mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-base sm:text-sm outline-none",
                            errors.company ? "border-rose-400 focus:border-rose-500" : "border-slate-300 focus:border-slate-900",
                          ].join(" ")}
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
                        className={[
                          "mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-base sm:text-sm outline-none",
                          errors.fullName ? "border-rose-400 focus:border-rose-500" : "border-slate-300 focus:border-slate-900",
                        ].join(" ")}
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
                        className={[
                            "mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-base sm:text-sm outline-none",
                            errors.phoneNumber ? "border-rose-400 focus:border-rose-500" : "border-slate-300 focus:border-slate-900",
                          ].join(" ")}
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
                        className={[
                          "mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-base sm:text-sm outline-none",
                          errors.email ? "border-rose-400 focus:border-rose-500" : "border-slate-300 focus:border-slate-900",
                        ].join(" ")}
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
                       className={[
                          "mt-2 w-full resize-none rounded-xl border bg-white px-3 py-2.5 text-base sm:text-sm outline-none",
                          errors.address ? "border-rose-400 focus:border-rose-500" : "border-slate-300 focus:border-slate-900",
                        ].join(" ")}
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
                          errors.startDate ? "border-rose-400 focus:border-rose-500" : "border-slate-300 focus:border-slate-900",
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
                          errors.endDate ? "border-rose-400 focus:border-rose-500" : "border-slate-300 focus:border-slate-900",
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
                        <label className="text-sm font-medium text-slate-800">
                          Project 
                          <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={selectedProjectGid}
                          onChange={(e) =>
                            setSelectedProjectGid(e.target.value)
                          }
                          className={[
                          "mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-base sm:text-sm outline-none",
                          errors.project ? "border-rose-400 focus:border-rose-500" : "border-slate-300 focus:border-slate-900",
                        ].join(" ")}
                        >
                          <option value="" disabled>
                             เลือกโปรเจกต์ 
                          </option>
                          {projectsState.data.map((p) => (
                            <option key={p.gid} value={p.gid}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        {errors.project && (
                          <p className="mt-1 text-xs text-rose-600">
                            {errors.project}
                          </p>
                        )}
                      </div>
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
                            errors.quantity ? "border-rose-500" : "border-slate-300"
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
                          errors.jobName ? "border-rose-400 focus:border-rose-500" : "border-slate-300 focus:border-slate-900",
                        ].join(" ")}
                      />
                      {errors.jobName && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.jobName}
                        </p>
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-800">
                          <label>ประเภทงาน <span className="text-red-600">*</span></label>

                          <select
                            value={workType}
                            onChange={(e) => setWorkType(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                          >
                            <option value="" disabled>เลือกประเภทงาน</option>
                            <option value="การ์ด">การ์ด</option>
                            <option value="ฏีกา">ฏีกา</option>
                            <option value="นามบัตร">นามบัตร</option>
                            <option value="โปสเตอร์">โปสเตอร์</option>
                            <option value="ใบปลิว">ใบปลิว</option>
                            <option value="แผ่นพับ">แผ่นพับ</option>
                            <option value="หนังสือ">หนังสือ</option>
                            <option value="อื่นๆ">อื่นๆ</option>
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

                  <Details files={files} setFiles={setFiles} />

                  <TypeOfWork />

                  

                  <Printer />
                </div>
              </div>
              {/* ปุ่มส่ง */}
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
                      onClick={(e) => e.stopPropagation()}
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
                            window.location.reload(); // ✅ รีเฟรชหลังผู้ใช้กดตกลง
                          }}
                        >
                          ตกลง
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
export default Form;
