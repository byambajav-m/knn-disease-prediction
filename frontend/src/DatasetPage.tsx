import  { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8080";

type Payload = {
  columns: string[];
  rows: string[][];
  total: number;
  page: number;
  page_size: number;
};

export default function DatasetPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [sp, setSp] = useSearchParams();

  const page = Math.max(1, Number(sp.get("page") || 1));
  const pageSize = Math.max(1, Number(sp.get("page_size") || 50));

  useEffect(() => {
    setLoading(true);
    setErr(null);
    fetch(`${API}/dataset/paginated?page=${page}&page_size=${pageSize}`)
      .then(r => r.ok ? r.json() : r.text().then(t => Promise.reject(t)))
      .then(setData)
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [page, pageSize]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.page_size));
  }, [data]);

  const go = (p: number, ps = pageSize) => {
    const np = Math.min(Math.max(1, p), totalPages || 1);
    const params = new URLSearchParams(sp);
    params.set("page", String(np));
    params.set("page_size", String(ps));
    setSp(params, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50 text-zinc-800">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-500" />
            <h1 className="font-semibold text-lg">Dataset Viewer</h1>
          </div>
          <nav className="text-sm">
            <Link className="text-indigo-600 hover:underline" to="/">← Back to Predictor</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-lg">
          <div className="p-5 border-b border-zinc-200 flex flex-wrap items-center gap-4 justify-between">
            <div>
              <h2 className="text-lg font-semibold">dataset.csv (paginated)</h2>
              <p className="text-sm text-zinc-500">
                Page {data?.page ?? page} of {totalPages} • Page size {data?.page_size ?? pageSize}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => go(1)}
                disabled={page <= 1}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                ⏮ First
              </button>
              <button
                onClick={() => go(page - 1)}
                disabled={page <= 1}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                ← Prev
              </button>
              <span className="text-sm text-zinc-600">Page</span>
              <input
                type="number"
                value={page}
                min={1}
                max={totalPages}
                onChange={(e) => go(Number(e.target.value) || 1)}
                className="w-20 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm"
              />
              <button
                onClick={() => go(page + 1)}
                disabled={page >= totalPages}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Next →
              </button>
              <button
                onClick={() => go(totalPages)}
                disabled={page >= totalPages}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Last ⏭
              </button>

              <span className="ml-4 text-sm text-zinc-600">Rows</span>
              <select
                value={pageSize}
                onChange={(e) => go(1, Number(e.target.value))}
                className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm"
              >
                {[20, 50, 100, 200, 500].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {err && <div className="p-5 text-sm text-red-600">{err}</div>}
          {loading && !err && <div className="p-5 text-sm text-zinc-500">Loading…</div>}

          {data && (
            <>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      {data.columns.map((c) => (
                        <th key={c} className="text-left px-3 py-2 sticky top-0">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, i) => (
                      <tr key={i} className="border-t border-zinc-200">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 text-xs text-zinc-500">
                Showing {(data.page - 1) * data.page_size + 1}–
                {Math.min(data.page * data.page_size, data.total)} of {data.total} rows
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
