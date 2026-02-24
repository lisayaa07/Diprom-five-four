import { useEffect, useRef, useState } from "react";
import { dbFetchJson } from "../lib/dbClient";

type ColorDoc = {
  _id: string;
  name_color: string;
};

type Props = {
  selected: string[];
  onChange: (colors: string[]) => void;
};

export default function Color({ selected, onChange }: Props) {
  const [colors, setColors] = useState<ColorDoc[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await dbFetchJson<ColorDoc[]>("/colors");
        setColors(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("โหลดสีไม่สำเร็จ", err);
      }
    };
    run();
  }, []);

  // ปิด dropdown เมื่อคลิกนอก
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColor = (color: string) => {
    if (selected.includes(color)) {
      onChange(selected.filter((c) => c !== color));
    } else {
      onChange([...selected, color]);
    }
  };

  return (
    <div className="mt-4 relative mb-4" ref={dropdownRef}>
      <label className="block text-sm font-medium text-slate-800 mb-2">
        สีที่ใช้
      </label>

      {/* กล่องเลือก */}
      <div
        onClick={() => setOpen(!open)}
        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm cursor-pointer bg-white"
      >
        {selected.length === 0 ? (
          <span className="text-slate-400">เลือกสี</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selected.map((c) => (
              <span
                key={c}
                className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
  className={`
    w-full absolute z-50 mt-1  bg-white border border-slate-200
    rounded-xl shadow-lg overflow-y-auto
    ${colors.length > 5 ? "max-h-48" : ""}
  `}
>
          {colors.map((c) => (
            <div
              key={c._id}
              onClick={() => toggleColor(c.name_color)}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 ${
                selected.includes(c.name_color) ? "bg-indigo-100" : ""
              }`}
            >
              {c.name_color}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}