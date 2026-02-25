import { type JSX } from "react";

type Props = {
  value: string[];
  onChange: (val: string[]) => void;
};

const OPTIONS = [
  "ตามตัวอย่าง",
  "ออกแบบใหม่",
  "แก้ไขแบบเดิม",
  "แนวตั้ง",
  "แนวนอน",
];

function Detail_Type({ value, onChange }: Props): JSX.Element {
  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter((v) => v !== item));
    } else {
      onChange([...value, item]);
    }
  };

  return (
    <div className="p-2 text-slate-800">
      <label className="font-bold">รูปแบบ</label>

      <div className="p-2 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        {OPTIONS.map((item) => (
          <label key={item} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.includes(item)}
              onChange={() => toggle(item)}
              className="h-4 w-4"
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default Detail_Type;