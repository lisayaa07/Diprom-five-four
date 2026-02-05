import React, { forwardRef, useImperativeHandle, useState } from "react";

export type CulcHandle = {
  open: () => void;
  close: () => void;
};

const Culc = forwardRef<CulcHandle>(function Culc(_, ref) {
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }));

  return (
    <>
      {/* ตัว component อื่นๆ ใน Culc จะอยู่ตรงนี้ได้ตามปกติ */}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* overlay */}
          <button
            aria-label="Close overlay"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          {/* modal */}
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">คำนวณกระดาษ</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                ปิด
              </button>
            </div>

            <div className="mt-4 text-sm text-slate-700">
              เนื้อหา/ฟอร์มคำนวณอยู่ในนี้
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default Culc;
