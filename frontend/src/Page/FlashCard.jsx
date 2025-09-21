import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MdChevronLeft, MdChevronRight, MdVisibility, MdVisibilityOff, MdShuffle, MdVolumeUp } from "react-icons/md";

/**
 * FlashCard.jsx
 * - Shows a set of face/name flashcards
 * - Big buttons, high-contrast, simple controls
 * - "Show Name" toggle, Next/Prev, Shuffle
 * - Text-to-speech for name (Audio option)
 * - Progress bar
 *
 * Replace the placeholder images with your uploaded assets.
 */

const sets = {
  family: {
    id: "family",
    label: "Family",
    cards: [
      {
        id: "susan",
        name: "Deren",
        relation: "Father",
        image:
          "../deren.jpg",
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

export default function FlashCard() {
  const [setId, setSetId] = useState("family");
  const [index, setIndex] = useState(0);
  const [showName, setShowName] = useState(false);

  const { cards, label } = useMemo(() => {
    const s = sets[setId];
    return { cards: s.cards, label: s.label };
  }, [setId]);

  const card = cards[index];

  const speak = useCallback(() => {
    if (!card?.name) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(card.name);
      u.rate = 0.95; // a bit slower
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

  function next() {
    setIndex((i) => (i + 1) % cards.length);
    setShowName(false);
  }

  function prev() {
    setIndex((i) => (i - 1 + cards.length) % cards.length);
    setShowName(false);
  }

  function shuffle() {
    // simple shuffle by rotating start index
    const r = Math.floor(Math.random() * cards.length);
    setIndex(r);
    setShowName(false);
  }

  useEffect(() => () => window.speechSynthesis.cancel(), []);

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Flashcards</h1>
        <Link to="/user/edit" className="rounded-full border px-4 py-2 text-sm bg-white   hover:bg-zinc-50">
          Add flashcards
        </Link>
      </div>

      {/* Set picker */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {Object.values(sets).map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSetId(s.id);
              setIndex(0);
              setShowName(false);
            }}
            className={`rounded-full border-1 px-3 py-1 text-sm bg-white ${
              setId === s.id ? " border-[#E7B904]  text-zinc-900" : "hover:border-[#E7B904] border-[#4D4D4D] "
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Progress current={index} total={cards.length} />

      {/* Card */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_4px_4px_rgba(0,0,0,1)]">
        <div className="relative aspect-[16/9] w-full bg-zinc-100">
          {card?.image ? (
            <img src={card.image} alt={`${card.name} (${card.relation})`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm opacity-60">No image</div>
          )}

          {/* Name overlay */}
          {showName && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
              <div className="text-xl font-semibold">{card.name}</div>
              <div className="text-sm opacity-90">{card.relation}</div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <button onClick={prev} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-zinc-50">
              <MdChevronLeft className="text-xl" /> Prev
            </button>
            <button onClick={next} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-zinc-50">
              Next <MdChevronRight className="text-xl" />
            </button>
            <button onClick={shuffle} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-zinc-50">
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
            <button onClick={speak} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-zinc-50">
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
