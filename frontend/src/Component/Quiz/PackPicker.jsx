import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// If you’re using wagmi, you can filter by connected owner.
import { useAccount } from "wagmi";

const IMG_BASE = "";

export default function PackPicker() {
  const { address } = useAccount();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const nav = useNavigate();

  useEffect(() => {
  let live = true;
  setLoading(true);
  setErr("");

  const query = address ? `?owner=${address}` : "";
  fetch(`/api/households${query}`, { credentials: "include" })
    .then(async (r) => {
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    })
    .then((data) => {
      if (!live) return;
      setPacks(
        (data || []).map((p) => ({
          ...p,
          thumbnail: p.thumbnail?.startsWith("http")
            ? p.thumbnail
            : p.thumbnail
            ? `${IMG_BASE}${p.thumbnail}`
            : "",
        }))
      );
    })
    .catch((e) => live && setErr(e.message || "Failed to load packs"))
    .finally(() => live && setLoading(false));

  return () => {
    live = false;
  };
}, [address]);


  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Choose a Memory Pack</h1>
        <Link to="/user" className="rounded-xl border border-gray-500 px-3 py-1.5 hover:bg-zinc-50">Back</Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">Loading packs…</div>
      ) : err ? (
        <div className="rounded-2xl border bg-white p-6 shadow-sm text-red-600">Error: {err}</div>
      ) : packs.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">No packs yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((p) => (
            <div key={`${p.contract}-${p.tokenId}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="aspect-video bg-zinc-100 hidden">
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt={p.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs opacity-60">No image</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{p.title}</h3>
                  <span className="text-xs opacity-70">#{p.tokenId}</span>
                </div>
                <p className="mt-1 text-sm opacity-70">{p.cards.length} card{p.count === 1 ? "" : "s"}</p>
                <button
                  onClick={() => nav(`/user/quiz/${p.tokenId}`)}
                  className="mt-3 w-full rounded-xl bg-[#E7B904] px-3 py-2 text-sm font-semibold text-white hover:bg-amber-300"
                >
                  Start Quiz
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
