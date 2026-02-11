import  {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
  useRef,
} from "react";
import * as htmlToImage from "html-to-image";

export type CalcHandle = {
  open: () => void;
  close: () => void;
};

type Unit = "mm" | "cm" | "inch";
type Orientation = "horizontal" | "vertical";

type StickerRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: Orientation;
};
type CalcProps = {
  onCaptured: (file: File) => void;
};

function convertToMm(value: number, unit: Unit): number {
  if (!Number.isFinite(value)) return 0;
  switch (unit) {
    case "mm":
      return value;
    case "cm":
      return value * 10;
    case "inch":
      return value * 25.4;
  }
}

function calculateMixedLayout(
  sheetWidth: number,
  sheetHeight: number,
  stickerWidth: number,
  stickerHeight: number,
  preferredOrientation: Orientation,
): StickerRect[] {
  const layout: StickerRect[] = [];
  let currentY = 0;

  while (currentY + Math.min(stickerWidth, stickerHeight) <= sheetHeight) {
    let currentX = 0;
    let rowHeight = 0;

    while (currentX + Math.min(stickerWidth, stickerHeight) <= sheetWidth) {
      const horizontalFits =
        currentX + stickerWidth <= sheetWidth &&
        currentY + stickerHeight <= sheetHeight;

      const verticalFits =
        currentX + stickerHeight <= sheetWidth &&
        currentY + stickerWidth <= sheetHeight;

      if (
        (preferredOrientation === "horizontal" && horizontalFits) ||
        (preferredOrientation === "vertical" && !verticalFits && horizontalFits)
      ) {
        layout.push({
          x: currentX,
          y: currentY,
          width: stickerWidth,
          height: stickerHeight,
          orientation: "horizontal",
        });
        currentX += stickerWidth;
        rowHeight = Math.max(rowHeight, stickerHeight);
      } else if (
        (preferredOrientation === "vertical" && verticalFits) ||
        (preferredOrientation === "horizontal" &&
          !horizontalFits &&
          verticalFits)
      ) {
        layout.push({
          x: currentX,
          y: currentY,
          width: stickerHeight,
          height: stickerWidth,
          orientation: "vertical",
        });
        currentX += stickerHeight;
        rowHeight = Math.max(rowHeight, stickerWidth);
      } else {
        break;
      }
    }

    currentY += rowHeight;
  }

  return layout;
}

const Calc = forwardRef<CalcHandle, CalcProps>(function Calc(
  { onCaptured },
  ref,
) {
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }));

  // ===== form state =====
  const [sheetUnit, setSheetUnit] = useState<Unit>("cm");
  const [stickerUnit, setStickerUnit] = useState<Unit>("cm");

  const [sheetWidthInput, setSheetWidthInput] = useState<string>("");
  const [sheetHeightInput, setSheetHeightInput] = useState<string>("");

  const [stickerWidthInput, setStickerWidthInput] = useState<string>("");
  const [stickerHeightInput, setStickerHeightInput] = useState<string>("");

  const [layout, setLayout] = useState<StickerRect[]>([]);
  const [sheetMm, setSheetMm] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const stats = useMemo(() => {
    const total = layout.length;
    const horizontalCount = layout.filter(
      (s) => s.orientation === "horizontal",
    ).length;
    const verticalCount = layout.filter(
      (s) => s.orientation === "vertical",
    ).length;
    return { total, horizontalCount, verticalCount };
  }, [layout]);

  function onCalculate() {
    const sheetW = convertToMm(parseFloat(sheetWidthInput), sheetUnit);
    const sheetH = convertToMm(parseFloat(sheetHeightInput), sheetUnit);
    const stickerW = convertToMm(parseFloat(stickerWidthInput), stickerUnit);
    const stickerH = convertToMm(parseFloat(stickerHeightInput), stickerUnit);

    if (sheetW <= 0 || sheetH <= 0 || stickerW <= 0 || stickerH <= 0) {
      setLayout([]);
      setSheetMm({ w: 0, h: 0 });
      return;
    }

    const horizontalFirst = calculateMixedLayout(
      sheetW,
      sheetH,
      stickerW,
      stickerH,
      "horizontal",
    );
    const verticalFirst = calculateMixedLayout(
      sheetW,
      sheetH,
      stickerW,
      stickerH,
      "vertical",
    );
    const best =
      horizontalFirst.length >= verticalFirst.length
        ? horizontalFirst
        : verticalFirst;

    setLayout(best);
    setSheetMm({ w: sheetW, h: sheetH });
  }


  const captureRef = useRef<HTMLDivElement | null>(null);



const onCapture = async () => {
  if (!captureRef.current) return;
  try {
    const blob = await htmlToImage.toBlob(captureRef.current);
    if (!blob) return;
    const file = new File([blob], "paper-layout.png", { type: "image/png" });
    
    onCaptured(file);   
    setShowSuccess(true);   
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);

  } catch (error) {
    console.error("Capture failed", error);
  }
};

  if (!isOpen) return null;

  const pad = 4;
  const vb =
    sheetMm.w > 0 && sheetMm.h > 0
      ? `${-pad} ${-pad} ${sheetMm.w + pad * 2} ${sheetMm.h + pad * 2}`
      : "0 0 1 1";

return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
    {/* overlay */}
    <button
      type="button"
      aria-label="close overlay"
      onClick={() => setIsOpen(false)}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
    />

    {/* modal */}
    <div className="relative z-10 flex h-full max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      
      {/* Header - ล็อกให้อยู่กับที่เสมอ */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
        <div className="text-base font-bold text-slate-900">คำนวณกระดาษ</div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-xl bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-200"
        >
          ปิด
        </button>
      </div>

      {/* Body - ส่วนนี้จะ Scroll ได้ถ้าจอมือถือสั้น */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-4 text-center text-xl font-bold text-slate-900">
            Sticker Layout Optimizer
          </h1>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Left: Form */}
            <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
              <section>
                <h2 className="mb-3 text-sm font-bold text-slate-900 uppercase tracking-tight">ขนาดแผ่นใหญ่</h2>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">หน่วยวัด</label>
                    <select
                      value={sheetUnit}
                      onChange={(e) => setSheetUnit(e.target.value as Unit)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="mm">mm</option>
                      <option value="cm">cm</option>
                      <option value="inch">inch</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-500 text-nowrap">กว้าง (Width)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={sheetWidthInput}
                        onChange={(e) => setSheetWidthInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-500 text-nowrap">สูง (Height)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={sheetHeightInput}
                        onChange={(e) => setSheetHeightInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-slate-100" />

              <section>
                <h2 className="mb-3 text-sm font-bold text-slate-900 uppercase tracking-tight">ขนาดแผ่นพิมพ์</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="block text-xs font-medium text-slate-500">หน่วยวัด</label>
                    <select
                      value={stickerUnit}
                      onChange={(e) => setStickerUnit(e.target.value as Unit)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="mm">mm</option>
                      <option value="cm">cm</option>
                      <option value="inch">inch</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-500 text-nowrap">กว้าง (Width)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={stickerWidthInput}
                      onChange={(e) => setStickerWidthInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-500 text-nowrap">สูง (Height)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={stickerHeightInput}
                      onChange={(e) => setStickerHeightInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </section>

              <button
                type="button"
                onClick={onCalculate}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-lg active:scale-95 transition-transform"
              >
                Calculate
              </button>
            </div>

            {/* Right: Results & Preview */}
            <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Results</h2>
                <div className="flex gap-2 text-[10px] font-bold">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700">แนวตั้ง: {stats.horizontalCount}</span>
                  <span className="rounded bg-green-100 px-2 py-0.5 text-green-700">แนวนอน: {stats.verticalCount}</span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900 p-3 text-center text-white">
                <div className="text-[10px] uppercase opacity-60">จำนวนชิ้นงานทั้งหมด</div>
                <div className="text-2xl font-black">{stats.total}</div>
              </div>

              {/* Preview SVG Container */}
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <div ref={captureRef} className="bg-white p-2">
                  <svg
                    width="100%"
                    className="aspect-square max-h-[300px] sm:max-h-[400px]"
                    viewBox={vb}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {sheetMm.w > 0 && sheetMm.h > 0 && (
                      <rect x={0} y={0} width={sheetMm.w} height={sheetMm.h} fill="transparent" stroke="#e2e8f0" />
                    )}
                    {layout.map((s, i) => (
                      <rect
                        key={i}
                        x={s.x}
                        y={s.y}
                        width={s.width}
                        height={s.height}
                        fill="none"
                        stroke={s.orientation === "horizontal" ? "#3b82f6" : "#22c55e"}
                        strokeWidth={2}
                      />
                    ))}
                  </svg>
                </div>
              </div>

              <button
                type="button"
                onClick={onCapture}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md active:scale-95 transition-transform"
              >
                แนบไปที่ Asana
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="absolute inset-x-0 bottom-6 flex justify-center z-[70]">
          <div className="rounded-full bg-green-600 px-6 py-2 text-sm font-bold text-white shadow-xl ">
            แนบไฟล์ไปยัง Asana สำเร็จ
          </div>
        </div>
      )}
    </div>
  </div>
);
});

export default Calc;
