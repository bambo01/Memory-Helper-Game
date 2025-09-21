// src/Page/FlashCard.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MdChevronLeft,
  MdChevronRight,
  MdVisibility,
  MdVisibilityOff,
  MdShuffle,
  MdVolumeUp,
} from "react-icons/md";
import { useAccount } from "wagmi";

// If your backend serves /uploads, point to it here (defaults to same origin)
const API_BASE =
  (import.meta?.env && import.meta.env.VITE_API_BASE_URL) || window.location.origin;

/* -------------------- Demo fallback sets -------------------- */
const sets = {
  family: {
    id: "family",
    label: "Family",
    cards: [
      {
        id: "susan",
        name: "Deren",
        relation: "Father",
        image: "../deren.jpg",
        hint: "This is your Father, Deren.",
      },
      {
        id: "jane",
        name: "Jane",
        relation: "Neighbor",
        image:
          "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=1200&auto=format&fit=crop",
        hint: "You see Jane every Sunday.",
      },
      {
        id: "michael",
        name: "Michael",
        relation: "Grandson",
        image:
          "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?q=80&w=1200&auto=format&fit=crop",
        hint: "He loves bringing you flowers.",
      },
    ],
  },
  friends: {
    id: "friends",
    label: "Friends",
    cards: [
      {
        id: "robert",
        name: "Robert",
        relation: "Friend",
        image:
          "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?q=80&w=1200&auto=format&fit=crop",
        hint: "You met Robert at church.",
      },
      {
        id: "anna",
        name: "Anna",
        relation: "Friend",
        image:
          "https://images.unsplash.com/photo-1558898479-33c0057a5d12?q=80&w=1200&auto=format&fit=crop",
        hint: "You bake together on Fridays.",
      },
    ],
  },
};

/* -------------------- Helpers -------------------- */
function Progress({ current, total }) {
  const pct = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs opacity-70">
        <span>
          Card {current + 1} / {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full bg-[#E7B904]"
          style={{ width: `${pct}%`, transition: "width 200ms" }}
        />
      </div>
    </div>
  );
}

function ipfsToHttp(uri) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  if (uri.startsWith("/ipfs/")) return `https://ipfs.io${uri}`;
  return uri;
}

function toAbsolute(url) {
  // convert /uploads/... into absolute URL at your backend origin
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return url;
}

/* -------------------- Component -------------------- */
export default function FlashCard() {
  const { address } = useAccount();

  // demo set state (fallback)
  const [setId, setSetId] = useState("family");

  // viewer state
  const [index, setIndex] = useState(0);
  const [showName, setShowName] = useState(false);

  // packs from DB
  const [packs, setPacks] = useState([]); // [{tokenId, contract, cid, flashCardName?, createdAt, owner?}]
  const [activePack, setActivePack] = useState(null); // selected pack
  const [manifestTitle, setManifestTitle] = useState("");
  const [manifestCards, setManifestCards] = useState([]);

  // UX
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [loadingPack, setLoadingPack] = useState(false);
  const [err, setErr] = useState("");

  /* ---- Load user packs from your DB ---- */
  useEffect(() => {
    let cancelled = false;
    async function loadPacks() {
      try {
        setLoadingPacks(true);
        setErr("");

        // If backend supports filtering by owner (recommended):
        const query = address ? `?owner=${address}` : "";
        const res = await fetch(`/api/households${query}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error(`Failed to load packs: ${res.status}`);
        const rows = await res.json();

        if (cancelled) return;

        // newest first (optional)
        const sorted = (rows || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setPacks(sorted);
      } catch (e) {
        console.error(e);
        setErr(e.message || "Failed to load packs.");
      } finally {
        if (!cancelled) setLoadingPacks(false);
      }
    }
    loadPacks();
    return () => {
      cancelled = true;
    };
  }, [address]);

  /* ---- Select a pack → fetch manifest from IPFS via its CID ---- */
  async function selectPack(pack) {
    try {
      setLoadingPack(true);
      setErr("");
      setActivePack(pack);
      setIndex(0);
      setShowName(false);

      const url = ipfsToHttp(`ipfs://${pack.cid}`);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Failed to fetch manifest: ${resp.status}`);
      const manifest = await resp.json();

      setManifestTitle(
        manifest.title || pack.flashCardName || `Pack #${pack.tokenId}`
      );

      const normalized = (manifest.cards || []).map((c) => ({
        id: c.id || Math.random().toString(36).slice(2),
        name: c.name || "",
        relation: c.relation || "",
        hint: c.hint || "",
        image: toAbsolute(c.imageUrl || c.image || ""),
      }));

      setManifestCards(normalized);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Failed to load pack.");
    } finally {
      setLoadingPack(false);
    }
  }

  /* ---- Decide whether to show pack cards or demo set ---- */
  const { cards, title } = useMemo(() => {
    if (activePack) {
      return { cards: manifestCards, title: manifestTitle };
    }
    const s = sets[setId];
    return { cards: s.cards, title: s.label };
  }, [activePack, manifestCards, manifestTitle, setId]);

  const card = cards[index];

  /* ---- Controls + TTS ---- */
  const speak = useCallback(() => {
    if (!card?.name) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(card.name);
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch {}
  }, [card?.name]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key.toLowerCase() === "s") setShowName((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, cards.length]);

  useEffect(() => () => window.speechSynthesis.cancel(), []);

  function next() {
    if (!cards.length) return;
    setIndex((i) => (i + 1) % cards.length);
    setShowName(false);
  }
  function prev() {
    if (!cards.length) return;
    setIndex((i) => (i - 1 + cards.length) % cards.length);
    setShowName(false);
  }
  function shuffle() {
    if (!cards.length) return;
    const r = Math.floor(Math.random() * cards.length);
    setIndex(r);
    setShowName(false);
  }

  /* -------------------- UI -------------------- */
  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{title || "Flashcards"}</h1>
        <Link
          to="/user/edit"
          className="rounded-full border px-4 py-2 text-sm bg-white hover:bg-zinc-50"
        >
          Add flashcards
        </Link>
      </div>

      {/* Packs from DB (real data) */}
      <div className="mb-3">
        <div className="mb-2 text-sm opacity-70">Your Packs</div>
        {loadingPacks ? (
          <div className="text-xs opacity-70">Loading packs…</div>
        ) : packs.length ? (
          <div className="flex flex-wrap items-center gap-2">
            {packs.map((p) => (
              <button
                key={`${p.contract}-${p.tokenId}`}
                onClick={() => selectPack(p)}
                className={`rounded-full px-3 py-1 text-sm border bg-white ${
                  activePack?.tokenId === p.tokenId
                    ? "border-[#E7B904]"
                    : "border-[#4D4D4D] hover:border-[#E7B904]"
                }`}
                title={`tokenId #${p.tokenId}`}
              >
                {p.flashCardName || `Pack #${p.tokenId}`}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs opacity-70">
            No packs yet — create one to see it here.
          </div>
        )}
      </div>

      {/* Fallback demo sets (only if no active real pack) */}
      {!activePack && (
        <div className="mb-4">
          <div className="mb-2 text-sm opacity-70">Sample Sets</div>
          <div className="flex flex-wrap items-center gap-2">
            {Object.values(sets).map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSetId(s.id);
                  setIndex(0);
                  setShowName(false);
                }}
                className={`rounded-full border-1 px-3 py-1 text-sm bg-white ${
                  setId === s.id
                    ? " border-[#E7B904]  text-zinc-900"
                    : "hover:border-[#E7B904] border-[#4D4D4D]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading + error states for selected pack */}
      {activePack && loadingPack && (
        <div className="text-xs opacity-70 mb-2">
          Loading pack “{manifestTitle || `#${activePack.tokenId}`}”…
        </div>
      )}
      {err && <div className="text-sm text-red-600 mb-2">Error: {err}</div>}

      <Progress current={index} total={cards.length} />

      {/* Card viewer */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_4px_4px_rgba(0,0,0,1)]">
        <div className="relative aspect-[16/9] w-full bg-zinc-100">
          {card?.image ? (
            <img
              src={card.image}
              alt={`${card.name || "Unknown"}${
                card.relation ? ` (${card.relation})` : ""
              }`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm opacity-60">
              No image
            </div>
          )}

          {/* Name overlay */}
          {showName && (card?.name || card?.relation) && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
              {card?.name && (
                <div className="text-xl font-semibold">{card.name}</div>
              )}
              {card?.relation && (
                <div className="text-sm opacity-90">{card.relation}</div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-zinc-50"
            >
              <MdChevronLeft className="text-xl" /> Prev
            </button>
            <button
              onClick={next}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-zinc-50"
            >
              Next <MdChevronRight className="text-xl" />
            </button>
            <button
              onClick={shuffle}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-zinc-50"
            >
              <MdShuffle className="text-xl" /> Shuffle
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowName((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-zinc-50"
            >
              {showName ? (
                <>
                  <MdVisibilityOff className="text-xl" /> Hide name
                </>
              ) : (
                <>
                  <MdVisibility className="text-xl" /> Show name
                </>
              )}
            </button>
            <button
              onClick={speak}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-zinc-50"
              disabled={!card?.name}
              title={card?.name ? `Speak "${card.name}"` : "No name"}
            >
              <MdVolumeUp className="text-xl" /> Hear name
            </button>
          </div>
        </div>

        {/* Hint */}
        {!showName && card?.hint && (
          <div className="border-t bg-zinc-50 p-4 text-sm opacity-80">
            Hint: {card.hint}
          </div>
        )}
      </div>
    </div>
  );
}
