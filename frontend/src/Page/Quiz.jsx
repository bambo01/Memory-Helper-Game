import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MdVolumeUp, MdLightbulb, MdSkipNext, MdReplay, MdCheckCircle, MdClose } from "react-icons/md";


const sampleCards = [
  {
    id: "susan",
    name: "Susan",
    relation: "Daughter",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop",
    hint: "This is your daughter, Susan.",
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
  {
    id: "robert",
    name: "Robert",
    relation: "Friend",
    image:
      "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?q=80&w=1200&auto=format&fit=crop",
    hint: "You met Robert at church.",
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ProgressBar({ value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs opacity-70">
        <span>Progress</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
        <div className="h-full bg-[#E7B904]" style={{ width: `${pct}%`, transition: "width 200ms" }} />
      </div>
    </div>
  );
}

export default function Quiz() {
  const [cards, setCards] = useState(sampleCards);

  // Order of card indices to ask; we reinsert wrong answers later
  const [order, setOrder] = useState(() => shuffle([...cards.keys()]));
  const [cursor, setCursor] = useState(0);

  // Learning state
  const [mastered, setMastered] = useState(() => new Set()); // first-time correct
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'

  // Always 4 choices
  const optionsCount = 4;

  const currentIdx = order[cursor];
  const currentCard = cards[currentIdx];

  const allNames = useMemo(() => cards.map((c) => c.name), [cards]);

  const options = useMemo(() => {
    if (!currentCard) return [];
    const others = allNames.filter((n) => n !== currentCard.name);
    // pick (optionsCount - 1) wrong answers (handle cases with fewer cards gracefully)
    const needed = Math.max(0, optionsCount - 1);
    const picks = shuffle(others).slice(0, needed);
    const base = [currentCard.name, ...picks];
    // If there are fewer than 4 total unique names available, just return what we have
    return shuffle(base);
  }, [currentCard, allNames]);

  const speakName = useCallback(() => {
    if (!currentCard?.name) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(currentCard.name);
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch {}
  }, [currentCard?.name]);

  useEffect(() => () => window.speechSynthesis.cancel(), []);

  // Handle an answer
  function answer(choice) {
    if (!currentCard) return;
    const isCorrect = choice === currentCard.name;
    setFeedback(isCorrect ? "correct" : "wrong");
    setTimeout(() => setFeedback(null), 900);

    if (isCorrect) {
      // Mark mastered only once
      if (!mastered.has(currentCard.id)) {
        setMastered((prev) => new Set(prev).add(currentCard.id));
      }
      // Next question
      setCursor((c) => Math.min(c + 1, order.length - 1));
    } else {
      // Reinsert the same card a bit later in the order
      setOrder((prev) => {
        const arr = [...prev];
        const idAtCursor = arr[cursor];
        const insertAt = Math.min(cursor + 3, arr.length);
        arr.splice(insertAt, 0, idAtCursor);
        return arr;
      });
      // Move on to next distinct card
      setCursor((c) => Math.min(c + 1, order.length));
    }
    setShowHint(false);
  }

  function skip() {
    if (!currentCard) return;
    // Move current to later without marking wrong
    setOrder((prev) => {
      const arr = [...prev];
      const idAtCursor = arr[cursor];
      const insertAt = Math.min(cursor + 3, arr.length);
      arr.splice(insertAt, 0, idAtCursor);
      return arr;
    });
    setCursor((c) => Math.min(c + 1, order.length));
    setShowHint(false);
  }

  function restart() {
    setOrder(shuffle([...cards.keys()]));
    setCursor(0);
    setMastered(new Set());
    setShowHint(false);
    setFeedback(null);
  }

  const done = mastered.size >= cards.length;

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Quiz Mode</h1>
        <div className="flex items-center gap-2 text-sm opacity-70">
          <span>Mastered: {mastered.size}/{cards.length}</span>
        </div>
      </div>

      <ProgressBar value={mastered.size} total={cards.length} />

      {/* Completed state */}
      {done ? (
        <div className="mt-6 rounded-2xl border bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
            <MdCheckCircle className="text-2xl" />
          </div>
          <h2 className="text-xl font-semibold">Great job!</h2>
          <p className="mt-1 text-sm opacity-80">You've completed today's set.</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button onClick={restart} className="rounded-xl border px-4 py-2 hover:bg-zinc-50 inline-flex items-center gap-2">
              <MdReplay /> Restart
            </button>
            <Link to="/user" className="rounded-xl border px-4 py-2 hover:bg-zinc-50">
              Back to Home
            </Link>
          </div>
        </div>
      ) : (
        <>
        <div className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm">
          {/* Image */}
          <div className="relative aspect-[16/9] w-full bg-zinc-100">
            {currentCard?.image ? (
              <img src={currentCard.image} alt="Who is this person?" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm opacity-60">No image</div>
            )}

            {/* Gentle feedback overlay */}
            {feedback && (
              <div
                className={`absolute inset-0 flex items-center justify-center text-white ${
                  feedback === "correct" ? "bg-green-600/40" : "bg-red-600/40"
                }`}
              >
                <div className="flex items-center gap-2 text-2xl font-semibold">
                  {feedback === "correct" ? <MdCheckCircle /> : <MdClose />} {feedback === "correct" ? "Well done!" : "Oops, try again soon"}
                </div>
              </div>
            )}
          </div>

          {/* Options (always 4 whenever possible) */}
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => answer(opt)}
                className="rounded-2xl border px-4 py-4 text-lg font-semibold hover:bg-zinc-50"
              >
                {opt}
              </button>
            ))}
          </div>

          
        </div>
        <div className="">
           {showHint && currentCard?.hint && (
            <div className=" p-4  opacity-80 flex gap-2 text-xl">
              <h1 className="font-bold">Hint: </h1>
              <h1 className="font-medium">{currentCard.hint}</h1>
            </div>
          )}
          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3  p-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowHint((v) => !v)} className="rounded-xl text-white font-semibold  px-3 bg-[#E7B904] py-2 text-sm hover:bg-amber-300 inline-flex items-center gap-2">
                <MdLightbulb className="text-lg" /> {showHint ? "Hide hint" : "Show hint"}
              </button>
              <button onClick={speakName} className="rounded-xl bg-[#E7B904] hover:bg-amber-300 px-3 py-2 text-sm text-white font-semibold inline-flex items-center gap-2">
                <MdVolumeUp className="text-lg" /> Hear name
              </button>
            </div>
            <button onClick={skip} className="rounded-xl text-[#4D4D4D]   px-3 py-2 text-xl hover:text-gray-400 inline-flex items-center gap-2">
              <MdSkipNext className="text-xl" /> Skip
            </button>
          </div>

         
        </div>
        </>
      )}

      <p className="mt-3 text-xs opacity-70">No timers. Take your time. Always four options per question.</p>
    </div>
  );
}
