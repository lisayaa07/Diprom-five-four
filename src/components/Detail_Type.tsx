import {  type Dispatch, type SetStateAction } from "react";
type DetailsProps = {
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
};

  
function Detail_Type({ files, setFiles }: DetailsProps) {
 
    return(
        <>
        <div className="p-2  text-slate-800 mt-0">
        <label className="font-bold">รูปแบบ</label>
        <div className="p-2 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 text-base sm:text-sm text-slate-800">
          <label className="flex items-center gap-2 cursor-pointer ">
            <input type="checkbox" name="Detail_Type" value="ตามตัวอย่าง" className="h-4 w-4" />
            <span className="text-base sm:text-sm text-slate-800 ">ตามตัวอย่าง</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer ">
            <input type="checkbox" name="Detail_Type" value="ออกแบบใหม่" className="h-4 w-4" />
            <span className="text-base sm:text-sm text-slate-800">ออกแบบใหม่</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer ">
            <input type="checkbox" name="Detail_Type" value="แก้ไขแบบเดิม" className="h-4 w-4" />
            <span className="text-base sm:text-sm text-slate-800 ">แก้ไขแบบเดิม</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer ">
            <input type="checkbox" name="Detail_Type" value="แนวตั้ง" className="h-4 w-4" />
            <span className="text-base sm:text-sm text-slate-800">แนวตั้ง</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer ">
            <input type="checkbox" name="Detail_Type" value="แนวนอน" className="h-4 w-4" />
            <span className="text-base sm:text-sm text-slate-800">แนวนอน</span>
          </label>
        </div>
      </div>
<div>
       {/* แนบไฟล์ */}
      <div className="p-2 flex flex-wrap items-center gap-2 text-base sm:text-sm text-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            ถ่ายรูป
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => {
                const picked = Array.from(e.target.files || []);
                if (picked.length === 0) return;
                setFiles((prev) => [...prev, ...picked]);
                e.currentTarget.value = "";
              }}
            />
          </label>

          <label className="text-sm font-medium text-slate-800 m-2 whitespace-nowrap">
            แนบไฟล์
          </label>

          <input
            type="file"
            multiple
            onChange={(e) =>
              setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])
            }
            className="mt-2 block text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
          />
        </div>

        {files.length > 0 && (
          <ul className="w-full mt-3 space-y-1 text-xs text-slate-600">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="ml-3 rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100"
                >
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
      </>
    )
}

export default Detail_Type