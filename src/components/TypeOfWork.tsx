function TypeOfWork(){
    return(
        <>
        <label>ชนิดรูปแบบงาน</label>
        <div className=" p-2 grid grid-cols-2 md:grid-cols-3 gap-4 items-center text-base sm:text-sm text-slate-800">
            <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="type_of_work"
                value="วานิชด้าน"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800 ">วานิชด้าน</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="type_of_work"
                value="วานิชงาน"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800">วานิชงาน</span>
            </label>

             <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="type_of_work"
                value="Dicut"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800 ">Dicut</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="type_of_work"
                value="ปั๊มนูน"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800 ">ปั๊มนูน</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="type_of_work"
                value="ปั๊มฟอล์ย"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800">ปั๊มฟอล์ย</span>
            </label>

             <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="type_of_work"
                value="เคลือบ UV ทั้งหน้า"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800 ">เคลือบ UV ทั้งหน้า</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="type_of_work"
                value="spot UV"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800 ">spot UV</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="type_of_work"
                value="ลามิเนตมัน"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800">ลามิเนตมัน</span>
            </label>

             <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="type_of_work"
                value="ลามิเนตด้าน"
                className="h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800 ">ลามิเนตด้าน</span>
            </label>
            
             
        </div>
        <div className=" p-2 grid items-center text-base sm:text-sm text-slate-800">

        
        <label className="flex items-center gap-2 cursor-pointer ">
              <input
                type="checkbox"
                name="type_of_work"
                value="อื่นๆ"
                className="peer h-4 w-4"
              />
              <span className="text-base sm:text-sm text-slate-800 cursor-pointer ">อื่นๆ</span>
              <div className=" pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto">
            <input
              type="text"
              name="other_type_of_work"
              className=" rounded-xl border border-slate-300 bg-white px-3 py-1 text-base sm:text-sm outline-none focus:border-slate-900"
            />
          </div>
            </label>
            
          </div>
           <hr className="my-6 border-slate-200" />
        </>
    )
}
export default TypeOfWork