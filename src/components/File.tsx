import React, { useMemo } from "react";
import { Camera, Paperclip, X, FileText } from "lucide-react";

interface FileUploadProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

const FileUpload: React.FC<FileUploadProps> = ({ files, setFiles }) => {
  
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length > 0) {
      setFiles((prev) => [...prev, ...picked]);
    }
    e.target.value = ""; // reset input
  };

  return (
    <div className="space-y-4">
      {/* ปุ่มกดเลือกไฟล์ */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-95">
          <Camera size={18} />
          ถ่ายรูป
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={onFileChange}
          />
        </label>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 active:scale-95">
          <Paperclip size={18} />
          แนบไฟล์
          <input
            type="file"
            multiple
            className="hidden"
            onChange={onFileChange}
          />
        </label>
      </div>

      {/* ส่วนแสดงผลไฟล์ (Previews) */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
          {files.map((file, index) => (
            <FilePreviewItem 
              key={`${file.name}-${index}`} 
              file={file} 
              onRemove={() => removeFile(index)} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Component ย่อยสำหรับแสดงแต่ละไฟล์
const FilePreviewItem = ({ file, onRemove }: { file: File; onRemove: () => void }) => {
  const isImage = file.type.startsWith("image/");
  
  // สร้าง URL สำหรับ Preview รูปภาพ
  const previewUrl = useMemo(() => {
    if (isImage) return URL.createObjectURL(file);
    return null;
  }, [file, isImage]);

  return (
    <div className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
      {isImage ? (
        <img
          src={previewUrl!}
          alt={file.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center p-2 text-slate-400">
          <FileText size={40} strokeWidth={1.5} />
          <span className="mt-2 block w-full truncate px-2 text-center text-[10px] font-medium text-slate-600">
            {file.name}
          </span>
        </div>
      )}

      {/* ปุ่มลบ (Overlay) */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg transition hover:bg-rose-600 active:scale-90"
      >
        <X size={16} />
      </button>

      {/* ขนาดไฟล์ (มุมล่าง) */}
      <div className="absolute bottom-2 left-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
        {(file.size / 1024).toFixed(0)} KB
      </div>
    </div>
  );
};

export default FileUpload;