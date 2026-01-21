function Paper_used() {
  return (
    <>
      <p>กระดาษที่ใช้</p>
      <div className=" grid grid-cols-1 md:grid-cols-2 gap-8 p-2 ">
        <div>
          <label>หนังสือ ปก</label>
          <input
            type="text"
            name="paper_cover"
            className="mt-2 w-full  rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base sm:text-sm outline-none focus:border-slate-900"
          />
        </div>
        <div>
          <label>เนื้อใน</label>
          <input
            type="text"
            name="paper_inside"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base sm:text-sm outline-none focus:border-slate-900"
          />
        </div>
      </div>

      <div className=" flex gap-8 sm:gap-12 mt-4 p-2">
        <label> งานบิล </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="billType"
            value="ธรรมดา"
            className="h-4 w-4"
          />
          <span className="text-base sm:text-sm text-slate-800">ธรรมดา</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="billType"
            value="คาร์บอน"
            className="h-4 w-4"
          />
          <span className="text-base sm:text-sm text-slate-800">คาร์บอน</span>
        </label>
      </div>
    </>
  );
}
export default Paper_used;
