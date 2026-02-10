import React, {
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

    const blob = await htmlToImage.toBlob(captureRef.current);
    if (!blob) return;

    const file = new File([blob], "paper-layout.png", {
      type: "image/png",
    });

    onCaptured(file); 
  };

  // ปิด = ไม่ render อะไร (แต่ยังถูกเรียก open() ได้)
  if (!isOpen) return null;

  const pad = 4;
  const vb =
    sheetMm.w > 0 && sheetMm.h > 0
      ? `${-pad} ${-pad} ${sheetMm.w + pad * 2} ${sheetMm.h + pad * 2}`
      : "0 0 1 1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <button
        type="button"
        aria-label="close overlay"
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-black/40"
      />

      {/* modal */}
      <div className="relative z-10 w-full max-w-5xl px-4">
        <div className="rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="text-base font-semibold text-slate-900">
              คำนวณกระดาษ
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              ปิด
            </button>
          </div>

          {/* body */}
          <div className="bg-slate-50 p-4">
            <div className="mx-auto max-w-5xl">
              <h1 className="mb-4 text-center text-xl font-semibold text-slate-900">
                Sticker Layout Optimizer
              </h1>

              <div className="grid gap-4 lg:grid-cols-2">
                {/* Left: Form */}
                <div className="rounded-2xl bg-white p-4 shadow">
                  <div className="space-y-4">
                    <div>
                      <h2 className="mb-2 text-base font-semibold text-slate-900">
                        ขนาดแผ่นใหญ่
                      </h2>

                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        หน่วยวัด
                      </label>
                      <select
                        value={sheetUnit}
                        onChange={(e) => setSheetUnit(e.target.value as Unit)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
                      >
                        <option value="mm">mm</option>
                        <option value="cm">cm</option>
                        <option value="inch">inch</option>
                      </select>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            ความกว้างแผ่นใหญ่ (Width)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={sheetWidthInput}
                            onChange={(e) => setSheetWidthInput(e.target.value)}
                            required
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            ความสูงแผ่นใหญ่ (Height)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={sheetHeightInput}
                            onChange={(e) =>
                              setSheetHeightInput(e.target.value)
                            }
                            required
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="mb-2 text-base font-semibold text-slate-900">
                        ขนาดแผ่นพิมพ์
                      </h2>

                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        หน่วยวัด
                      </label>
                      <select
                        value={stickerUnit}
                        onChange={(e) => setStickerUnit(e.target.value as Unit)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
                      >
                        <option value="mm">mm</option>
                        <option value="cm">cm</option>
                        <option value="inch">inch</option>
                      </select>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            ความกว้างแผ่นพิมพ์ (Width)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={stickerWidthInput}
                            onChange={(e) =>
                              setStickerWidthInput(e.target.value)
                            }
                            required
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            ความสูงแผ่นพิมพ์ (Height)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={stickerHeightInput}
                            onChange={(e) =>
                              setStickerHeightInput(e.target.value)
                            }
                            required
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onCalculate}
                      className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Calculate
                    </button>

                    {(sheetMm.w <= 0 ||
                      sheetMm.h <= 0 ||
                      layout.length === 0) && (
                      <p className="text-xs text-slate-500">
                        *กรอกค่าทั้งหมดให้มากกว่า 0 แล้วกด Calculate
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Result + SVG */}
                <div className="rounded-2xl bg-white p-4 shadow">
                  <h2 className="mb-3 text-base font-semibold text-slate-900">
                    Results
                  </h2>

                  <div className="space-y-1 text-sm text-slate-700">
                    <div>
                      จำนวนชิ้นงานทั้งหมด :{" "}
                      <span className="font-semibold">{stats.total}</span>
                    </div>
                    <div>
                      วางตามแนวตั้ง :{" "}
                      <span className="font-semibold">
                        {stats.horizontalCount}
                      </span>
                    </div>
                    <div>
                      วางตามแนวนอน :{" "}
                      <span className="font-semibold">
                        {stats.verticalCount}
                      </span>
                    </div>
                    
                    <div>
                      <button type="button" onClick={onCapture}
                      className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                       แนบไปที่ Asana
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <div ref={captureRef} className="p-3 bg-white">
                      <svg
                        width="100%"
                        height="400"
                        viewBox={vb}
                        preserveAspectRatio="xMidYMid meet"
                      >
                        {sheetMm.w > 0 && sheetMm.h > 0 && (
                          <rect
                            x={0}
                            y={0}
                            width={sheetMm.w}
                            height={sheetMm.h}
                            fill="transparent"
                          />
                        )}

                        {layout.map((s, i) => (
                          <rect
                            key={i}
                            x={s.x}
                            y={s.y}
                            width={s.width}
                            height={s.height}
                            fill="none"
                            stroke={
                              s.orientation === "horizontal"
                                ? "#007bff"
                                : "#28a745"
                            }
                            strokeWidth={2}
                          />
                        ))}
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* end body */}
        </div>
      </div>
    </div>
  );
});

export default Calc;
