// การเข้าเล่ม
import  { useState } from "react";

function Binding() {
  const [runEnabled, setRunEnabled] = useState(false);
  const [runBookEnabled, setRunBookEnabled] = useState(false);
  const [runNoEnabled, setRunNoEnabled] = useState(false);

  const sectionCls = (enabled: boolean) =>
    `mt-2 flex items-center gap-3 pl-7 ${enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`;

  return (
    <>
      <div className="space-y-3">
        <label className="block  ">การเข้าเล่ม,ตีปรุและรันนัมเบอร์</label>

        {/* ===== แถว 1===== */}
        <div className="flex items-center  gap-4 rounded-xl px-4 py-1">
          <input
            type="checkbox"
            name="bind_wire_enabled"
            className="peer h-4 w-4"
          />

          <label className="cursor-pointer text-base sm:text-sm text-slate-800">
            เย็บลวด
          </label>

          <div className="ml-auto flex flex-wrap items-center gap-3 opacity-40 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto">
            {["มุงหลังคา", "หัว", "ข้าง"].map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="bind_wire_pos"
                  value={c}
                  className="h-4 w-4"
                />
                <span className="text-base sm:text-sm text-slate-800">{c}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ===== แถว 2===== */}
        <div className="flex items-center justify-between gap-4 rounded-xl px-4 py-1">
          <input
            type="checkbox"
            name="bind_press_enabled"
            className="peer h-4 w-4"
          />

          <label className="cursor-pointer text-base sm:text-sm text-slate-800">
            อัดสัน
          </label>

          <div className="ml-auto flex flex-wrap items-center gap-3 opacity-40 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto">
            {["หัว", "ข้าง"].map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="bind_press_pos"
                  value={c}
                  className="h-4 w-4"
                />
                <span className="text-base sm:text-sm text-slate-800">{c}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ===== แถว 3 ===== */}
        <div className="flex items-center gap-4 rounded-xl px-4 py-1">
          <input type="checkbox" name="bind_glue" className="peer h-4 w-4" />

          <label className="cursor-pointer text-base sm:text-sm text-slate-800">
            ไสกาว
          </label>

          <input type="checkbox" name="bind_fold" className="peer h-4 w-4" />

          <label className="cursor-pointer text-base sm:text-sm text-slate-800">
            พับ
          </label>
          <div className="ml-auto opacity-40 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto">
            <input
              type="text"
              name="bind_fold_detail"
              className="w-[260px] max-w-[55vw] rounded-xl border border-slate-300 bg-white px-3 py-1 text-base sm:text-sm outline-none focus:border-slate-900"
            />
          </div>
          <p className="text-base sm:text-sm text-slate-800">พับ</p>
        </div>

        {/* ===== แถว 4 ===== */}
        <div className="flex items-center gap-4 rounded-xl px-4 py-1">
          <input type="checkbox" name="bind_other" className="peer h-4 w-4" />

          <label className="cursor-pointer text-base sm:text-sm text-slate-800">
            อื่นๆ
          </label>
          <div className="ml-auto opacity-40 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto">
            <input
              type="text"
              name="bind_other_detail"
              className="w-[200px] max-w-[55vw] rounded-xl border border-slate-300 bg-white px-3 py-1 text-base sm:text-sm outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {/* ===== แถว 5===== */}
        <div className="flex items-center  gap-4 rounded-xl px-4 py-1">
          <input
            type="checkbox"
            name="bind_perforate"
            className="peer h-4 w-4"
          />

          <label className="cursor-pointer text-base sm:text-sm text-slate-800">
            ปรุ
          </label>

          <div className="ml-auto flex flex-wrap items-center gap-3 opacity-40 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto">
            {["หัว", "กลาง", "ข้าง"].map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="bind_perforate_pos"
                  value={c}
                  className="h-4 w-4"
                />
                <span className="text-base sm:text-sm text-slate-800">{c}</span>
              </label>
            ))}
          </div>
        </div>
        {/* ===== แถว 6: รันนัมเบอร์ ===== */}

        <div className="rounded-xl px-4 py-2">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="bind_run_enabled"
              className="h-4 w-4"
              checked={runEnabled}
              onChange={(e) => {
                const v = e.target.checked;
                setRunEnabled(v);
                if (!v) {
                  setRunBookEnabled(false);
                  setRunNoEnabled(false);
                }
              }}
            />
            <span className="text-base sm:text-sm text-slate-800">
              รันนัมเบอร์
            </span>
            <span className="text-base sm:text-sm text-slate-800">สี/</span>

            <input
              type="text"
              name="bind_run_color"
              disabled={!runEnabled}
              className={`w-[220px] max-w-[55vw] rounded-xl border border-slate-300 bg-white px-3 py-1 text-base sm:text-sm outline-none focus:border-slate-900 ${
                runEnabled ? "" : "opacity-40 pointer-events-none"
              }`}
            />
          </div>

          {/* เล่มที่ */}
          <div className={sectionCls(runEnabled)}>
            <input
              type="checkbox"
              name="bind_run_book_enabled"
              className="h-4 w-4"
              checked={runBookEnabled}
              onChange={(e) => setRunBookEnabled(e.target.checked)}
            />
            <span className="text-base sm:text-sm text-slate-800">เล่มที่</span>
            <input
              type="text"
              name="bind_run_book"
              disabled={!runBookEnabled}
              className={`w-[220px] max-w-[55vw] rounded-xl border border-slate-300 bg-white px-3 py-1 text-base sm:text-sm outline-none focus:border-slate-900 ${
                runBookEnabled ? "" : "opacity-40 pointer-events-none"
              }`}
            />
          </div>

          {/* เลขที่ */}
          <div
            className={`${runEnabled ? "mt-2 pl-7" : "mt-2 pl-7 opacity-40 pointer-events-none"}`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="checkbox"
                name="bind_run_no_enabled"
                className="h-4 w-4"
                checked={runNoEnabled}
                onChange={(e) => setRunNoEnabled(e.target.checked)}
              />
              <span className="text-base sm:text-sm text-slate-800">
                เลขที่
              </span>

              <label
                className={`flex items-center gap-2 cursor-pointer ${runNoEnabled ? "" : "opacity-40 pointer-events-none"}`}
              >
                <input
                  type="radio"
                  name="bind_run_range"
                  value="01-50"
                  className="h-4 w-4"
                  disabled={!runNoEnabled}
                />
                <span className="text-base sm:text-sm text-slate-800">
                  01-50
                </span>
              </label>

              <label
                className={`flex items-center gap-2 cursor-pointer ${runNoEnabled ? "" : "opacity-40 pointer-events-none"}`}
              >
                <input
                  type="radio"
                  name="bind_run_range"
                  value="001-100"
                  className="h-4 w-4"
                  disabled={!runNoEnabled}
                />
                <span className="text-base sm:text-sm text-slate-800">
                  001-100
                </span>
              </label>

              <label
                className={`flex items-center gap-2 cursor-pointer ${runNoEnabled ? "" : "opacity-40 pointer-events-none"}`}
              >
                <input
                  type="radio"
                  name="bind_run_range"
                  value="ยาว"
                  className="h-4 w-4"
                  disabled={!runNoEnabled}
                />
                <span className="text-base sm:text-sm text-slate-800">ยาว</span>
              </label>

              <input
                type="text"
                name="bind_run_range_custom"
                disabled={!runNoEnabled}
                className={`w-[220px] max-w-[60vw] rounded-xl border border-slate-300 bg-white px-3 py-1 text-base sm:text-sm outline-none focus:border-slate-900 ${
                  runNoEnabled ? "" : "opacity-40 pointer-events-none"
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Binding;
