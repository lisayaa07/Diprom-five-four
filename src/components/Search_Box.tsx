import { useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

function SearchBox(): JSX.Element {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const go = () => {
    const s = q.trim();
    if (!s) return;
    nav(`/search-user?q=${encodeURIComponent(s)}`);
    setQ("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
      className="flex items-center gap-2 mx-10 mb-5 mt-5"
    >
      <div className="relative ">   
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาลูกค้า..."
          className="pl-10 pr-4 py-2 rounded-xl border bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-64"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      </div>

      <button
        type="submit"
        disabled={!q.trim()}
        className="bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700 transition disabled:opacity-50"
      >
        ค้นหา
      </button>
    </form>
  );
}

export default SearchBox;
