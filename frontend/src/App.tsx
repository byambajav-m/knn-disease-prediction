import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Metric = "hamming" | "jaccard" | "cosine" | "euclidean";

type Neighbor = {
  label: string;
  distance: number;
  count?: number;
  agg_weight?: number;
};

type PredictResponse = {
  predicted_disease: string;
  k: number;
  metric: Metric;
  neighbors: Neighbor[];
  used_symptoms: string[];
  ignored_symptoms: string[];
};

const API = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const METRICS: Metric[] = ["hamming", "jaccard", "cosine", "euclidean"];
const eps = 1e-9;

export default function App() {
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [k, setK] = useState(7);
  const [metricA, setMetricA] = useState<Metric>("hamming");
  const [compare, setCompare] = useState(false);
  const [metricB, setMetricB] = useState<Metric>("jaccard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resA, setResA] = useState<PredictResponse | null>(null);
  const [resB, setResB] = useState<PredictResponse | null>(null);

  useEffect(() => {
    fetch(`${API}/symptoms`)
      .then((r) => r.json())
      .then((data) => setAllSymptoms(data.symptoms || []))
      .catch((e) => setError(String(e)));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allSymptoms.slice(0, 100);
    return allSymptoms.filter((s) => s.toLowerCase().includes(q)).slice(0, 100);
  }, [search, allSymptoms]);

  const toggle = (s: string) => {
    setSelected((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  async function predict() {
    setLoading(true);
    setError(null);
    setResA(null);
    setResB(null);
    try {
      const bodyA = { symptoms: selected, k, metric: metricA };
      const rA = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyA),
      });
      if (!rA.ok) throw new Error(await rA.text());
      const a: PredictResponse = await rA.json();
      setResA(a);

      if (compare) {
        const bodyB = { symptoms: selected, k, metric: metricB };
        const rB = await fetch(`${API}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyB),
        });
        if (!rB.ok) throw new Error(await rB.text());
        const b: PredictResponse = await rB.json();
        setResB(b);
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50 text-zinc-800">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-500" />
            <h1 className="font-semibold text-lg">KNN Disease Predictor</h1>
          </div>
          <code className="text-xs text-zinc-500">API: {API}</code>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 grid gap-6 md:grid-cols-[1.1fr,1fr]">


        {/* Controls */}
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-lg">
          <div className="p-5 border-b border-zinc-200">
            <h2 className="text-lg font-semibold">Controls</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Select symptoms, choose k, and pick a distance metric.
            </p>
          </div>

          <div className="p-5 space-y-5">
            {/* Multi-select */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Symptoms
              </label>
              <div className="rounded-xl border border-zinc-300 bg-white px-3 py-2">
                <input
                  type="text"
                  placeholder="Search symptoms..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm"
                />
                {filtered.length > 0 && search && (
                  <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-zinc-200 bg-white shadow">
                    {filtered.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggle(s)}
                        className={`block w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 ${
                          selected.includes(s)
                            ? "bg-indigo-100 text-indigo-800 font-medium"
                            : "text-zinc-700"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected tags */}
              <div className="mt-2 flex flex-wrap gap-2">
                {selected.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs"
                  >
                    {s}
                    <button
                      onClick={() => toggle(s)}
                      className="w-4 h-4 grid place-items-center rounded-full bg-indigo-200 hover:bg-indigo-300 text-xs"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* k slider + metric */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  k (neighbors): <span className="font-mono">{k}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={25}
                  value={k}
                  onChange={(e) => setK(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Metric
                </label>
                <select
                  value={metricA}
                  onChange={(e) => setMetricA(e.target.value as Metric)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  {METRICS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compare */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  id="compare"
                  type="checkbox"
                  checked={compare}
                  onChange={(e) => setCompare(e.target.checked)}
                  className="accent-indigo-600"
                />
                <label htmlFor="compare" className="text-sm text-zinc-700">
                  Compare with another metric
                </label>
              </div>
              {compare && (
                <select
                  value={metricB}
                  onChange={(e) => setMetricB(e.target.value as Metric)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  {METRICS.filter((m) => m !== metricA).map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={predict}
                disabled={!selected.length || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 text-sm text-white font-medium"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                )}
                Predict
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        </section>


        {/* Results */}
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-lg">
          <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Result</h2>
            <div className="flex gap-2 text-xs text-zinc-600">
              {resA && (
                <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800">
                  pred: {resA.predicted_disease}
                </span>
              )}
              {resB && (
                <span className="px-2 py-1 rounded bg-purple-100 text-purple-800">
                  pred (B): {resB.predicted_disease}
                </span>
              )}
            </div>
          </div>

          <div className="p-5 space-y-6">
            {!resA && !loading && (
              <p className="text-sm text-zinc-500">
                Run a prediction to see unique diseases and their distances.
              </p>
            )}
            {resA && <ResultPanel title="Primary" data={resA} />}
            {compare && resB && (
              <>
                <div className="h-px bg-zinc-200" />
                <ResultPanel title="Comparison" data={resB} />
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ResultPanel({ title, data }: { title: string; data: PredictResponse }) {
  const dist = useMemo(
    () => data.neighbors.map((n) => ({ name: n.label, distance: n.distance })),
    [data]
  );

  const votes = useMemo(() => {
    return data.neighbors
      .map((n) => ({
        label: n.label,
        weight:
          typeof n.agg_weight === "number" ? n.agg_weight : 1 / (n.distance + eps),
      }))
      .sort((a, b) => b.weight - a.weight);
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800 text-xs">{title}</span>
        <span className="px-2 py-1 rounded bg-zinc-100 text-zinc-800 text-xs">k={data.k}</span>
        <span className="px-2 py-1 rounded bg-zinc-100 text-zinc-800 text-xs">metric={data.metric}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 rounded-xl border border-zinc-200 bg-white p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dist}>
              <XAxis dataKey="name" stroke="#555" />
              <YAxis stroke="#555" />
              <RTooltip
                formatter={(v: number, _n, p) => [v.toFixed(4), (p?.payload as any)?.name]}
              />
              <Bar dataKey="distance" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="h-64 rounded-xl border border-zinc-200 bg-white p-3">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                  data={votes}
                  dataKey="weight"
                  nameKey="label"
                  labelLine={false}
                >
                  {votes.map((_, i) => (
                    <Cell key={i} fill={["#6366f1", "#a855f7", "#f59e0b", "#ef4444"][i % 4]} />
                  ))}
                </Pie>
              <RTooltip
                formatter={(v: number, name: string) => [
                  `${(v as number).toFixed(4)} (wt)`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-zinc-200">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="text-left px-3 py-2">Disease</th>
              <th className="text-left px-3 py-2">Distance</th>
              <th className="text-left px-3 py-2">Count</th>
              <th className="text-left px-3 py-2">Agg. Weight</th>
            </tr>
          </thead>
          <tbody>
            {data.neighbors.map((n) => (
              <tr
                key={n.label}
                className={`border-t border-zinc-200 ${
                  n.label === data.predicted_disease ? "bg-indigo-50/60" : ""
                }`}
              >
                <td className="px-3 py-2">{n.label}</td>
                <td className="px-3 py-2">{n.distance.toFixed(4)}</td>
                <td className="px-3 py-2">{n.count ?? "—"}</td>
                <td className="px-3 py-2">
                  {typeof n.agg_weight === "number"
                    ? n.agg_weight.toFixed(4)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
