import React, { useEffect, useState, type FormEvent, type JSX } from "react";

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

export default function Add(): JSX.Element {
  const [projectsState, setProjectsState] = useState<State<Project[]>>({
    status: "loading",
    data: null,
    error: null,
  });

  const [selectedProjectGid, setSelectedProjectGid] = useState<string>("");

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    lineId: "",
    address: "",
    extra: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);

  // โหลด projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setProjectsState({ status: "loading", data: null, error: null });

        const res = await fetch(`/api/projects?workspace=${WORKSPACE_GID}`, {
          headers: { Accept: "application/json" },
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

        if (list.length > 0)
          setSelectedProjectGid((prev) => prev || list[0].gid);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setResult("");

    try {
      if (projectsState.status !== "success")
        throw new Error("Projects ยังโหลดไม่เสร็จ");
      const selectedProject = projectsState.data.find(
        (p) => p.gid === selectedProjectGid,
      );
      if (!selectedProject) throw new Error("ไม่พบโปรเจกต์ที่เลือก");

      const notes = [
        `ชื่อ: ${formData.fullName}`,
        `ประเภท: ${selectedProject.name}`,
        `เบอร์โทร: ${formData.phoneNumber}`,
        `อีเมล: ${formData.email}`,
        `Line: ${formData.lineId}`,
        `ที่อยู่: ${formData.address}`,
        formData.extra ? `เพิ่มเติม: ${formData.extra}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const payload = {
        data: {
          name: formData.fullName,
          notes,
          projects: [selectedProjectGid],
        },
      };

      const res = await fetch(`/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
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
      if (!taskGid) {
        throw new Error("สร้าง task สำเร็จแต่หา task gid ไม่เจอจาก response");
      }

      if (files.length > 0) {
        const uploadResults: any[] = [];

        for (const file of files) {
          const form = new FormData();
          form.append("file", file); 

          const up = await fetch(`/api/tasks/${taskGid}/attachments`, {
            method: "POST",
            body: form,
          });

          const upText = await up.text();
          let upJson: any;
          try {
            upJson = JSON.parse(upText);
          } catch {
            upJson = { raw: upText };
          }

          if (!up.ok) {
            throw new Error(
              `อัปโหลดไฟล์ "${file.name}" ไม่สำเร็จ (HTTP ${up.status})\n` +
                JSON.stringify(upJson, null, 2),
            );
          }

          uploadResults.push({ file: file.name, response: upJson });
        }

        setResult(
          "✅ สร้าง Task และแนบไฟล์สำเร็จ\n\n" +
            "Task response:\n" +
            JSON.stringify(json, null, 2) +
            "\n\nUpload results:\n" +
            JSON.stringify(uploadResults, null, 2),
        );
        return;
      }

      // ถ้าไม่มีไฟล์ ก็แสดงผลสร้าง task อย่างเดียว
      setResult("✅ สร้าง Task สำเร็จ\n\n" + JSON.stringify(json, null, 2));
    } catch (e) {
      setResult("❌ Error\n\n" + (e instanceof Error ? e.message : String(e)));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6">
          <p className="mt-1 text-sm text-slate-600">
            Workspace: <span className="font-mono">{WORKSPACE_GID}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">
                ฟอร์มสร้าง Task
              </div>
              <div className="text-xs text-slate-500">
                {projectsState.status === "success"
                  ? `Projects: ${projectsState.data.length}`
                  : projectsState.status === "loading"
                    ? "กำลังโหลด Projects..."
                    : "โหลด Projects ไม่สำเร็จ"}
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {projectsState.status === "loading" && (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                กำลังโหลดรายการโปรเจกต์…
              </div>
            )}

            {projectsState.status === "error" && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 whitespace-pre-wrap">
                {projectsState.error}
              </div>
            )}

            {projectsState.status === "success" && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-slate-800">
                    ประเภท (Project)
                  </label>
                  <select
                    value={selectedProjectGid}
                    onChange={(e) => setSelectedProjectGid(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                  >
                    {projectsState.data.map((p) => (
                      <option key={p.gid} value={p.gid}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-800">
                      ชื่อ - นามสกุล
                    </label>
                    <input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                      placeholder="ชื่อที่ต้องการให้ไปเป็นชื่อ Task"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-800">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-800">
                      อีเมล
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-800">
                      Line
                    </label>
                    <input
                      name="lineId"
                      value={formData.lineId}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-800">
                      ที่อยู่
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-800">
                      เพิ่มเติม
                    </label>
                    <textarea
                      name="extra"
                      value={formData.extra}
                      onChange={handleChange}
                      rows={3}
                      className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                {/* แนบไฟล์ */}
                <div>
                  <label className="text-sm font-medium text-slate-800">
                    แนบไฟล์
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    className="mt-2 block w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                  />
                  {files.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-slate-600">
                      {files.map((f, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <span className="truncate">{f.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFiles((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                            className="ml-3 rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100"
                          >
                            ลบ
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creating ? "กำลังสร้าง..." : "สร้าง Task"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {result && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <div className="text-sm font-semibold text-slate-800">
                ผลลัพธ์
              </div>
            </div>
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap px-6 py-4 text-xs text-slate-800">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
