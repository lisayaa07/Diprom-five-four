function Pasansee() {
  return (
    <div className="space-y-3">
      <label className="block  font-medium ">ปะสันสี</label>

      {/* ===== แถว 1: กระดาษ ===== */}
      <div className="flex  gap-4 rounded-xl px-4 py-3">
        <input
          id="chk-paper"
          name="pasansee_paper_enabled"
          type="checkbox"
          className="peer h-4 w-4"
        />

        {/* ซ้าย: ชื่อ */}
        <label
          htmlFor="chk-paper"
          className="cursor-pointer text-base sm:text-sm text-slate-800"
        >
          กระดาษ
        </label>

        {/* ขวา: ตัวเลือกสี — ล็อกก่อน แล้วปลดเมื่อ peer checked */}
        <div className="ml-auto flex flex-wrap items-center gap-3 opacity-40 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto">
          {["น้ำตาล", "ชมพู", "ฟ้า", "เขียว", "เหลือง"].map((c) => (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pasansee_paper_color"
                value={c}
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800">{c}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ===== แถว 2: แล็กซีน ===== */}
      <div className="flex gap-4 rounded-xl  px-4 py-3">
        <input
          id="chk-laxine"
          name="pasansee_laxine_enabled"
          type="checkbox"
          className="peer h-4 w-4"
        />

        <label
          htmlFor="chk-laxine"
          className="cursor-pointer text-base sm:text-sm text-slate-800"
        >
          แล็กซีน
        </label>

        <div className="ml-auto opacity-40 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto">
          <input
            type="text"
            name="pasansee_laxine_color"
            placeholder="กรอกสีแล็กซีน"
            className="w-[260px] max-w-[55vw] rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base sm:text-sm outline-none focus:border-slate-900"
          />
        </div>
      </div>
    </div>
  );
}

export default Pasansee;
