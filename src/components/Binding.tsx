// การเข้าเล่ม

function Binding() {
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
          <p>พับ</p>
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
      </div>
    </>
  );
}

export default Binding;
