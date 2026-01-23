import { useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";

function SearchBox(): JSX.Element {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  return (
    <div className="ml-120 mb-6">
      <label>ค้นหาลูกค้า</label>

      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          name="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="ml-1 rounded-lg border border-slate-300 px-2 py-1 text-base sm:text-sm outline-none focus:border-slate-900"
        />

        <button
          type="button"
          onClick={() => nav(`/search-user?q=${encodeURIComponent(q.trim())}`)}
          disabled={!q.trim()}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          ค้นหา
        </button>
      </div>
    </div>
  );
}

export default SearchBox;
