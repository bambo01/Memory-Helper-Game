// QuizCore.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { MdVolumeUp, MdLightbulb, MdSkipNext, MdReplay, MdCheckCircle, MdClose } from "react-icons/md";

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

const FALLBACK_NAMES = [
  "Alice","Bob","Charlie","Diana","Edward","Fiona","George","Hannah",
  "Isaac","Julia","Kevin","Luna","Michael","Nina","Oscar","Paula",
  "Quincy","Rosa","Sam","Tina","Uma","Victor","Wendy","Xavier","Yara","Zane"
];

export default function QuizCore({
  title = "Quiz Mode",
  cardsProp = [],
  onMastered,          // called once when user finishes the set
  onClaimBadge,        // click handler to mint the badge
  claimState,          // { status: 'idle'|'claiming'|'pending'|'success'|'error', txHash, error }
  claimDisabled,       // boolean to disable claim button
  txUrl,               // (hash) => explorer url
}) {
  const [cards, setCards] = useState(cardsProp);
  useEffect(() => setCards(cardsProp || []), [cardsProp]);

  const empty = !cards || cards.length === 0;

  const [order, setOrder] = useState(() => shuffle([...Array(cards.length).keys()]));
  useEffect(() => setOrder(shuffle([...Array(cards.length).keys()])), [cards.length]);

  const [cursor, setCursor] = useState(0);
  const [mastered, setMastered] = useState(() => new Set());
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const optionsCount = 4;
  const currentIdx = order[cursor];
  const currentCard = cards[currentIdx];

  const options = useMemo(() => {
    if (!currentCard) return [];
    const packNames = cards.map(c => c.name).filter(Boolean);
    const pool = Array.from(new Set([...packNames, ...FALLBACK_NAMES]))
      .filter(n => n && n !== currentCard.name);

    const neededWrong = Math.max(0, optionsCount - 1);
    const wrongs = shuffle(pool).slice(0, neededWrong);
    while (wrongs.length < neededWrong) wrongs.push(`Name ${wrongs.length + 1}`);

    return shuffle([currentCard.name, ...wrongs]);
  }, [currentCard, cards]);

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

  function bumpThreeAhead() {
    setOrder((prev) => {
      const arr = [...prev];
      const idAtCursor = arr[cursor];
      // remove current position to avoid duplicates
      arr.splice(cursor, 1);
      // insert 3 ahead (clamped to end)
      const insertAt = Math.min(cursor + 3, arr.length);
      arr.splice(insertAt, 0, idAtCursor);
      // move cursor forward safely
      setCursor((c) => Math.min(c + 1, Math.max(arr.length - 1, 0)));
      return arr;
    });
  }

  function answer(choice) {
    if (!currentCard) return;
    const isCorrect = choice === currentCard.name;
    setFeedback(isCorrect ? "correct" : "wrong");
    setTimeout(() => setFeedback(null), 900);

    if (isCorrect) {
      if (!mastered.has(currentCard.id)) {
        setMastered((prev) => new Set(prev).add(currentCard.id));
      }
      setCursor((c) => Math.min(c + 1, Math.max(order.length - 1, 0)));
    } else {
      bumpThreeAhead();
    }
    setShowHint(false);
  }

  function skip() {
    if (!currentCard) return;
    bumpThreeAhead();
    setShowHint(false);
  }

  function restart() {
    setOrder(shuffle([...Array(cards.length).keys()]));
    setCursor(0);
    setMastered(new Set());
    setShowHint(false);
    setFeedback(null);
    setSent(false);
  }

  const done = mastered.size >= cards.length;

  // notify parent once when done
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (done && !sent) {
      setSent(true);
      onMastered?.({ masteredCount: mastered.size, total: cards.length });
    }
  }, [done, sent, mastered.size, cards.length, onMastered]);

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="flex items-center gap-2 text-sm opacity-70">
          <span>Mastered: {mastered.size}/{cards.length}</span>
        </div>
      </div>

      <ProgressBar value={mastered.size} total={cards.length} />

      {empty ? (
        <div className="mt-6 rounded-2xl border bg-white p-6 text-center shadow-sm">
          <p className="opacity-80">No cards found in this pack yet.</p>
          <a href="/user" className="mt-3 inline-block rounded-xl border px-4 py-2 hover:bg-zinc-50">
            Back to Home
          </a>
        </div>
      ) : done ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
            <MdCheckCircle className="text-2xl" />
          </div>
          <h2 className="text-xl font-semibold">Great job!</h2>
          <p className="mt-1 text-sm opacity-80">You've completed today's set.</p>

          {onClaimBadge && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                onClick={onClaimBadge}
                disabled={!!claimDisabled}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                  claimDisabled ? "bg-amber-300 cursor-not-allowed" : "bg-[#E7B904] hover:bg-amber-300"
                }`}
              >
                {claimState?.status === "idle" && "Claim Badge"}
                {claimState?.status === "claiming" && "Claiming…"}
                {claimState?.status === "pending" && "Waiting for confirmation…"}
                {claimState?.status === "success" && "Badge Claimed 🎉"}
                {claimState?.status === "error" && "Retry Claim"}
              </button>

              {claimState?.txHash && txUrl && (
                <a
                  className={`text-sm underline ${
                    claimState?.status === "success" ? "text-green-700" : "text-blue-600"
                  }`}
                  href={txUrl(claimState.txHash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on BaseScan
                </a>
              )}
              {claimState?.status === "error" && (
                <p className="text-sm text-red-600">Couldn’t mint: {claimState.error}</p>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-3">
            <button onClick={restart} className="rounded-xl border px-4 py-2 hover:bg-zinc-50 inline-flex items-center gap-2">
              <MdReplay /> Restart
            </button>
            <a href="/user" className="rounded-xl border px-4 py-2 hover:bg-zinc-50">
              Back to Home
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="relative aspect-[16/9] w-full bg-zinc-100">
              {currentCard?.image ? (
                <img src={currentCard.image} alt="Who is this person?" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm opacity-60">No image</div>
              )}

              {feedback && (
                <div className={`absolute inset-0 flex items-center justify-center text-white ${
                  feedback === "correct" ? "bg-green-600/40" : "bg-red-600/40"
                }`}>
                  <div className="flex items-center gap-2 text-2xl font-semibold">
                    {feedback === "correct" ? <MdCheckCircle /> : <MdClose />}{" "}
                    {feedback === "correct" ? "Well done!" : "Oops, try again soon"}
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {(Array.isArray(options) ? options : []).map((opt, i) => (
                <button
                  key={`${opt}-${i}`}
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
              <div className="p-4 opacity-80 flex gap-2 text-xl">
                <span className="font-bold">Hint:</span>
                <span className="font-medium">{currentCard.hint}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHint((v) => !v)}
                  className="rounded-xl text-white font-semibold px-3 bg-[#E7B904] py-2 text-sm hover:bg-amber-300 inline-flex items-center gap-2"
                >
                  <MdLightbulb className="text-lg" /> {showHint ? "Hide hint" : "Show hint"}
                </button>
                <button
                  onClick={speakName}
                  className="rounded-xl bg-[#E7B904] hover:bg-amber-300 px-3 py-2 text-sm text-white font-semibold inline-flex items-center gap-2"
                >
                  <MdVolumeUp className="text-lg" /> Hear name
                </button>
              </div>
              <button
                onClick={skip}
                className="rounded-xl text-[#4D4D4D] px-3 py-2 text-xl hover:text-gray-400 inline-flex items-center gap-2"
              >
                <MdSkipNext className="text-xl" /> Skip
              </button>
            </div>
          </div>
        </>
      )}

      <p className="mt-3 text-xs opacity-70">
        No timers. Take your time. Always four options per question.
      </p>
    </div>
  );
}
