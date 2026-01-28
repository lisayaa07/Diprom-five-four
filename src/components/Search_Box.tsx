import { useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";

function SearchBox(): JSX.Element {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const go = () => {
    const s = q.trim();
    if (!s) return;
    nav(`/search-user?q=${encodeURIComponent(s)}`);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700">
        ค้นหาลูกค้า
      </label>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          name="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") go();
          }}
          placeholder="พิมพ์ชื่อบริษัท..."
          className="w-full flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />

        <button
          type="button"
          onClick={go}
          disabled={!q.trim()}
          className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          ค้นหา
        </button>
      </div>
    </div>
  );
}

export default SearchBox;
