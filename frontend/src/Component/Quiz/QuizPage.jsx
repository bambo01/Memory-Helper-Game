import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import QuizCore from "./QuizCore";


// If your images are stored like "/uploads/…", set a base if needed:
// const IMG_BASE = import.meta.env.VITE_API_BASE || "";
const IMG_BASE = "";

export default function QuizPage() {
  const { tokenId } = useParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [pack, setPack] = useState(null);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setErr("");

    fetch(`/api/households/byToken/${encodeURIComponent(tokenId)}`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => {
        if (!live) return;
        const cards = (data.cards || []).map((c) => ({
          id: String(c.id),
          name: c.name,
          relation: c.relation || "",
          hint: c.hint || "",
          image: c.image?.startsWith("http") ? c.image : (c.image ? `${IMG_BASE}${c.image}` : ""),
        }));
        setPack({ ...data, cards });
      })
      .catch((e) => live && setErr(e.message || "Failed to load pack"))
      .finally(() => live && setLoading(false));

    return () => { live = false; };
  }, [tokenId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">Loading pack…</div>
      </div>
    );
  }

  if (err || !pack) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-red-600">Error: {err || "Pack not found"}</p>
          <Link to="/user/packs" className="mt-3 inline-block rounded-xl border px-4 py-2 hover:bg-zinc-50">
            Back to Packs
          </Link>
        </div>
      </div>
    );
  }

  return <QuizCore title={`Quiz: ${pack.title}`} cardsProp={pack.cards} />;
}
