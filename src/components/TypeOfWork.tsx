function TypeOfWork() {
  return (
    <>
      <label className="block font-medium text-slate-800">
        ชนิดรูปแบบงาน
      </label>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 text-sm text-slate-800">

        {[
          "วานิชด้าน",
          "วานิชงาน",
          "Dicut",
          "ปั๊มนูน",
          "ปั๊มฟอล์ย",
          "เคลือบ UV ทั้งหน้า",
          "spot UV",
          "ลามิเนตมัน",
          "ลามิเนตด้าน",
        ].map((item) => (
          <label key={item} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="type_of_work"
              value={item}
              className="h-4 w-4"
            />
            <span>{item}</span>
          </label>
        ))}

        {/* อื่นๆ */}
        <label className="flex items-center gap-2 cursor-pointer col-span-2 md:col-span-4">
          <input
            type="checkbox"
            name="type_of_work"
            value="อื่นๆ"
            className="peer h-4 w-4"
          />
          <span>อื่นๆ</span>

          <input
            type="text"
            name="other_type_of_work"
            placeholder="ระบุเพิ่มเติม..."
            className="ml-3 hidden peer-checked:block rounded-xl border border-slate-300 px-3 py-1 text-sm outline-none focus:border-slate-900"
          />
        </label>

      </div>
    </>
  );
}

export default TypeOfWork;