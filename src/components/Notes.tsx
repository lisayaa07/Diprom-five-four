import { useState, useEffect } from "react";

type Props = {
  value?: string;
  onChange: (val: string) => void;
  placeholder?: string;
};

export default function AdditionalDetails({
  value = "",
  onChange,
  placeholder = "กรอกรายละเอียดเพิ่มเติม...",
}: Props) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    onChange(val);
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-slate-800 mb-2">
        ข้อมูลเพิ่มเติม
      </label>

      <textarea
        value={text}
        onChange={handleChange}
        rows={4}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm 
                   focus:outline-none focus:ring-1 focus:ring-black
                    resize-none"
      />

      <div className="text-right text-xs text-slate-400 mt-1">
        {text.length} ตัวอักษร
      </div>
    </div>
  );
}