// src/SuperAdmin.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "./lib/axios"; // 👈 ใช้ instance


type MasterItem = { _id: string; [k: string]: any };

type ResourceConf = {
  key: "printers" | "type-works" | "colors" | "units" | "print-types";
  title: string;
  listPath: string;
  createPath: string;
  deletePath: (id: string) => string;
  nameField: string;
  label: string;
};

export default function SuperAdmin() {


  const resources: ResourceConf[] = useMemo(
    () => [
      {
        key: "printers",
        title: "Printers",
        listPath: "/printers",
        createPath: "/printers",
        deletePath: (id) => `/printers/${id}`,
        nameField: "name_printer",
        label: "ชื่อเครื่องพิมพ์",
      },
      {
        key: "type-works",
        title: "Type Works",
        listPath: "/type-works",
        createPath: "/type-works",
        deletePath: (id) => `/type-works/${id}`,
        nameField: "name_tw",
        label: "ชื่อประเภทงาน",
      },
      {
        key: "colors",
        title: "Colors",
        listPath: "/colors",
        createPath: "/colors",
        deletePath: (id) => `/colors/${id}`,
        nameField: "name_color",
        label: "ชื่อสี",
      },
      {
      key: "units",
      title: "Units",
      listPath: "/units",
      createPath: "/units",
      deletePath: (id) => `/units/${id}`,
      nameField: "name_unit", // ต้องตรงกับฟิลด์ใน Database ที่คุณดึงมาใช้ใน Form
      label: "ชื่อหน่วยนับ",
    },

    {
      key: "print-types",
      title: "Print Types",
      listPath: "/print-types",
      createPath: "/print-types",
      deletePath: (id) => `/print-types/${id}`,
      nameField: "name_print_type", 
      label: "ชื่อรูปแบบงาน",
    },
    ],
    [],
  );

  const [tab, setTab] = useState<ResourceConf["key"]>("type-works");
  const conf = resources.find((r) => r.key === tab)!;

  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");

  // ✅ LOAD
  const load = async () => {
    try {
      setLoading(true);
      setErr("");

      const { data } = await axios.get(conf.listPath);

      const list = Array.isArray(data) ? data : data?.data ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setErr(e.response?.data?.message || e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setName("");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ✅ CREATE
  const onCreate = async () => {
    if (!name.trim()) return;

    try {
      setLoading(true);
      setErr("");

      await axios.post(conf.createPath, {
        [conf.nameField]: name.trim(),
      });

      setName("");
      await load();
    } catch (e: any) {
      setErr(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ DELETE
  const onDelete = async (id: string) => {
    if (!confirm("ต้องการลบรายการนี้ใช่ไหม?")) return;

    try {
      setLoading(true);
      setErr("");

      await axios.delete(conf.deletePath(id));

      await load();
    } catch (e: any) {
      setErr(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };
  console.log("ROLE:", localStorage.getItem("role"));

  return (
    <div className="min-h-screen bg-slate-50 ">
      <header className="lg:ml-20 lg:mr-20 max-w-5xl px-6 py-6 flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold text-slate-900">SuperAdmin</div>
          <div className="text-sm text-slate-600">
            จัดการ Master DB (เพิ่ม/ลบข้อมูล)
          </div>
        </div>

       
      </header>

      <main className="lg:ml-20 lg:mr-20 max-w-5xl px-6 pb-10">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {resources.map((r) => (
            <button
              key={r.key}
              onClick={() => setTab(r.key)}
              className={[
                "rounded-xl px-4 py-2 text-sm border",
                tab === r.key
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-800 border-slate-300",
              ].join(" ")}
            >
              {r.title}
            </button>
          ))}
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 whitespace-pre-wrap">
            {err}
          </div>
        )}

        {/* Create */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-lg font-semibold text-slate-900">
            {conf.title}
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={conf.label}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
            />
            <button
              disabled={loading}
              onClick={onCreate}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              เพิ่ม
            </button>
          </div>
        </div>

        {/* List */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">
              รายการทั้งหมด
            </div>
            <button
              disabled={loading}
              onClick={load}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-60"
            >
              รีเฟรช
            </button>
          </div>

          {loading ? (
            <div className="p-5 text-sm text-slate-600">กำลังโหลด...</div>
          ) : items.length === 0 ? (
            <div className="p-5 text-sm text-slate-600">ยังไม่มีข้อมูล</div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {items.map((it) => (
                <li
                  key={it._id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div className="text-sm text-slate-900">
                    {String(
                      it[conf.nameField] ?? it.name ?? it.title ?? "-"
                    )}
                  </div>
                  <button
                    onClick={() => onDelete(it._id)}
                    className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm text-rose-700"
                  >
                    ลบ
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
      </main>
    </div>
  );
}
