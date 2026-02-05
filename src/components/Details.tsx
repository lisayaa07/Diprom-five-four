import { useRef, type Dispatch, type SetStateAction } from "react";
import Calc, { type CalcHandle } from "./Calc";

type DetailsProps = {
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
};

export default function Details({ files, setFiles }: DetailsProps) {
  const calcRef = useRef<CalcHandle>(null);

  return (
    <>
      <p>รายละเอียดงาน</p>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => calcRef.current?.open()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          คำนวณกระดาษ
        </button>

        {/* ต้อง render ไว้ในหน้าเพื่อให้ ref ใช้งานได้ */}
        <Calc ref={calcRef} />
      </div>

      <div className=" p-2 grid grid-cols-2 md:grid-cols-2 gap-4 items-center text-base sm:text-sm text-slate-800">
        <div>
          <label>ขนาดสำเร็จ</label>
          <input
            type="text"
            name="detail"
            className="mt-2 m-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base sm:text-sm outline-none focus:border-slate-900"
          />
        </div>
        <div>
          <p>หน่วย</p>
          <input
            type="text"
            name="unit"
            className="mt-2 m-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base sm:text-sm outline-none focus:border-slate-900"
          />
        </div>
      </div>

      <div className=" p-2 grid grid-cols-2 md:grid-cols-2 gap-4 items-center text-base sm:text-sm text-slate-800">
        <div>
          <label className="whitespace-nowrap">ขนาดตัดกระดาษ</label>
          <input
            type="text"
            name="size"
            className="mt-2 m-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base sm:text-sm outline-none focus:border-slate-900"
          />
        </div>
        <div>
          <label>จำนวนพิมพ์</label>
          <input
            type="text"
            name="count_Detail"
            className="mt-2 m-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base sm:text-sm outline-none focus:border-slate-900"
          />
        </div>
      </div>

      <div className="p-2 text-base sm:text-sm text-slate-800">
        <label>รูปแบบ</label>
        <div className="p-2 grid grid-cols-2 md:grid-cols-5 gap-4 text-base sm:text-sm text-slate-800">
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

      <hr className="my-6 border-slate-200" />
    </>
  );
}
