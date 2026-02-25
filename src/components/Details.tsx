import { useRef, type Dispatch, type SetStateAction } from "react";
import Calc, { type CalcHandle } from "./Calc";


type DetailsProps = {
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
};

export default function Details({ setFiles }: DetailsProps) {
  const calcRef = useRef<CalcHandle>(null);

  return (
    <>
      

      <div className="space-y-4 mt-2">
        <button
          type="button"
          onClick={() => calcRef.current?.open()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          คำนวณกระดาษ
        </button>
                <Calc
            ref={calcRef}
            onCaptured={(file) => {
              setFiles((prev) => [...prev, file]);
            }}
          />
      </div>

      <div className="  grid lg:grid-cols-4 md:grid-cols-2 gap-4 items-center text-base sm:text-sm text-slate-800">
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
      

     

   
    </>
  );
}
