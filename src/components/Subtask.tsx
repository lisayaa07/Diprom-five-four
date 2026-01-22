import  { useMemo, type JSX } from "react";

type Project = { gid: string; name: string };

export type SubtaskDraft = {
  id: string;
  name: string;
  projectGid: string;
};

type SubtaskProps = {
  projects: Project[];
  disabled?: boolean;
  value: SubtaskDraft[];
  onChange: (next: SubtaskDraft[]) => void;
};

const makeId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};


function Subtask({ projects, value, onChange, disabled }: SubtaskProps): JSX.Element {
  const subtasks = value;

  const addSubtask = () => {
    onChange([
      ...subtasks,
      { id: makeId(), name: "", projectGid: "" },
    ]);
  };

  const updateSubtask = (id: string, patch: Partial<SubtaskDraft>) => {
    onChange(subtasks.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeSubtask = (id: string) => {
    onChange(subtasks.filter((s) => s.id !== id));
  };

  const projectOptions = useMemo(() => projects, [projects]);

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-sm font-medium text-slate-800">
          Subtasks
        </h3>

        <button
          type="button"
          onClick={addSubtask}
          disabled={disabled}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          + เพิ่ม Subtask
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {subtasks.length === 0 && (
          <div className="text-sm text-slate-500">ยังไม่มี Subtask</div>
        )}

        {subtasks.map((s, idx) => (
          <div
            key={s.id}
            className="rounded-xl border border-slate-200 bg-white p-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div className="md:col-span-1">
                <label className="text-xs text-slate-600">ชื่อ Subtask</label>
                <input
                  value={s.name}
                  onChange={(e) => updateSubtask(s.id, { name: e.target.value })}
                  placeholder={`Subtask #${idx + 1}`}
                  disabled={disabled}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 disabled:opacity-60"
                />
              </div>

              <div className="md:col-span-1">
                <label className="text-xs text-slate-600">
                  แสดงในโปรเจกต์ (เลือกได้)
                </label>
                <select
                  value={s.projectGid}
                  onChange={(e) =>
                    updateSubtask(s.id, { projectGid: e.target.value })
                  }
                  disabled={disabled}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 disabled:opacity-60"
                >
                  <option value="">ไม่ต้องแสดงในโปรเจกต์</option>
                  {projectOptions.map((p) => (
                    <option key={p.gid} value={p.gid}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeSubtask(s.id)}
                  disabled={disabled}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default Subtask;