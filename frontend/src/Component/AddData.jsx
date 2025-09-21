// src/Page/addData.jsx
import React, { useEffect, useRef, useState } from "react";
import { CiCircleRemove } from "react-icons/ci";
import { RiImageEditLine } from "react-icons/ri";
import { IoAdd } from "react-icons/io5";


import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { decodeEventLog } from "viem";
import ABI from "../abi/MemoryPack.json";
import { useNavigate } from "react-router-dom";


export default function AddData() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [currentName, setCurrentName] = useState("");
   const [flashCardName, setFlashCardName] = useState("");
   const [Hint,setHint] = useState("");
  const [cards, setCards] = useState([]); // {id, file, preview, name}
  const [error, setError] = useState("");
  const inputRef = useRef(null);      // file input
  const nameRef = useRef(null);       // NEW: name input
  const { isConnected } = useAccount();
const publicClient = usePublicClient();
const { writeContractAsync } = useWriteContract();
const navigate = useNavigate();

const [currentRelation, setCurrentRelation] = useState("");  
const [saving, setSaving] = useState(false);


  

  const MAX_MB = 10;

  function handleFiles(files) {
    const f = files?.[0];
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_MB} MB.`);
      return;
    }
    setError("");
    setFile(f);
    setPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }

  function onChange(e) { handleFiles(e.target.files); }
  function onDrop(e) { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); }
  function onDragOver(e) { e.preventDefault(); e.stopPropagation(); }

  function clearWorkingCard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
    setCurrentName("");
    setHint("");
    if (inputRef.current) inputRef.current.value = ""; // clear file
    if (nameRef.current) nameRef.current.value = "";   // NEW: hard reset name
  }

  function handleAddCard() {
  if (!file) return setError("Please select an image first.");
  const nameToAdd = currentName.trim();
  if (!nameToAdd) return setError("Please enter a name.");

  const id = Date.now();
  const preview = previewUrl;

  setCards(prev => [
    ...prev,
    { id, file, preview, name: nameToAdd, relation: currentRelation.trim(), hint: Hint.trim() } // NEW fields
  ]);
  setError("");

  // reset the working inputs
  setCurrentName("");
  setCurrentRelation("");
  setHint("");
  setFile(null);
  setPreviewUrl("");
  if (inputRef.current) inputRef.current.value = "";
  if (nameRef.current) {
    nameRef.current.value = "";
    setTimeout(() => nameRef.current?.focus(), 0);
  }
}


  function removeCard(id) {
    setCards(prev => {
      const card = prev.find(c => c.id === id);
      if (card?.preview) URL.revokeObjectURL(card.preview);
      return prev.filter(c => c.id !== id);
    });
  }

 async function handleSubmit(e) {
  console.log('Save')
  e.preventDefault();
  if (!isConnected) return setError("Please connect your wallet first.");
  if (!cards.length) return setError("Please add at least one flashcard.");

  setSaving(true);
  setError("");

  try {
    // 1) Upload files + meta to your backend
    //    Expect response: [{ id, name, relation, hint, imageUrl }]
    const fd = new FormData();
    fd.append(
      "meta",
      JSON.stringify(
        cards.map(c => ({
          id: String(c.id),
          name: c.name,
          relation: c.relation || "",
          hint: c.hint || ""
        }))
      )
    );
    cards.forEach((c, i) => {
      if (c.file) fd.append(`image_${i}`, c.file, c.file.name || `card-${i}.jpg`);
    });
    
    // right after you build fd:
console.log("meta:", fd.get("meta"));
for (const [k, v] of fd.entries()) {
  if (v instanceof File) {
    console.log(k, { name: v.name, type: v.type, size: v.size });
  } else {
    console.log(k, v);
  }
}


    const up = await fetch("/api/flashcards/batchUpsert", {
      method: "POST",
      body: fd
    });
    if (!up.ok) throw new Error("Upload failed.");
    const saved = await up.json(); 

    // 2) Build manifest -> get CID (title uses flashCardName)
    const man = await fetch("/api/manifest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: flashCardName || "Family Pack",
        cards: saved
      })
    });
    const { cid } = await man.json();
      console.log(cid);
    if (!cid) throw new Error("No CID returned from manifest.");

    // 3) Create Memory Pack on Base (first time)
    const txHash = await writeContractAsync({
      abi: ABI,
      address: CONTRACT,
      functionName: "createPack",
      args: [cid, []], // members array if you want to add caregivers now
    });

    // 4) Wait and read PackCreated(tokenId, owner, cid)
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    let tokenId = null;
    for (const log of receipt.logs) {
      try {
        const { eventName, args } = decodeEventLog({
          abi: ABI,
          data: log.data,
          topics: log.topics
        });
        if (eventName === "PackCreated") {
          tokenId = Number(args.tokenId);
          break;
        }
      } catch {}
    }
    if (tokenId == null) throw new Error("PackCreated event not found.");

    // 5) Persist in your backend (so app knows which pack belongs to this user)
    await fetch("/api/households", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        tokenId,
        contract: CONTRACT,
        cid
      })
    });

    // 6) Success UX
    alert(`Created Memory Pack #${tokenId} on Base ✅`);
    navigate("/user"); // or wherever you’d like to go
  } catch (err) {
    setError(err.message || "Failed to create memory pack.");
  } finally {
    setSaving(false);
  }
}


  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      cards.forEach(c => c.preview && URL.revokeObjectURL(c.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[calc(90dvh-4rem)] flex items-start justify-center px-4 py-10 flex-col">
      {/* If you keep this top field, it now hard-resets via nameRef */}
      <div className="flex border px-2 py-3 rounded-lg mb-2 bg-white border-gray-200 w-2xl shadow-[0_4px_4px_rgba(9,9,9,0.5)]">
        <label className="font-semibold text-[#4D4D4D] text-xl ">Flashcard Name:</label>
        <input
          ref={nameRef}                             
          type="text"
          value={flashCardName}
          onChange={(e) => setFlashCardName(e.target.value)}
          className="w-1/2 focus:outline-none focus:ring-0 ml-3"
          placeholder="e.g., Dela Cruz Family"
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_4px_4px_rgba(9,9,9,0.5)]"
      >
        <h1 className="text-2xl font-semibold text-[#4D4D4D]">Add Flashcard Image</h1>
        <p className="text-sm opacity-80">Upload a clear photo. PNG or JPG, up to {MAX_MB} MB.</p>

        {!previewUrl ? (
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center hover:bg-zinc-50"
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
            aria-label="Upload image"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" className="opacity-70">
              <path fill="currentColor" d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2z" />
              <path fill="currentColor" d="M17 8V4h-2v4h-4v2h4v4h2v-4h4V8z" />
            </svg>
            <div className="text-sm"><span className="font-medium">Click to upload</span> or drag and drop</div>
            <div className="text-xs opacity-70">PNG, JPG — up to {MAX_MB} MB</div>
            <input ref={inputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-300">
            <div className="aspect-[16/9] w-full overflow-hidden rounded-t-2xl bg-zinc-100">
              <img src={previewUrl} alt="Selected preview" className="h-full w-full object-cover" />
            </div>

            <div className="flex flex-col gap-3 p-3">
              <div className="flex w-full justify-between items-center">
                <div className="min-w-0 border rounded-full px-2 py-1 border-gray-300">
                  <label htmlFor="" className="font-semibold">Relationship:</label>
                  <input 
                    type="text" 
                    className="ml-3 focus:outline-none focus:ring-0"
                    value={currentRelation}
                    onChange={(e) => setCurrentRelation(e.target.value)}
                      placeholder="e.g., Father" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => inputRef.current?.click()}><RiImageEditLine className="text-3xl" />
</button>
                  <button type="button" onClick={clearWorkingCard} className=""><CiCircleRemove className="text-3xl" /></button>
                  <input ref={inputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />
                </div>
              </div>

              {/* (Optional) keep a second name field here if you like; it uses the same state */}
              <div className="flex items-center border border-gray-300 rounded-full px-2 py-1">
                <label className="text-lg font-semibold">Name:</label>
                <input
                  type="text"
                  value={currentName}
                  onChange={(e) => setCurrentName(e.target.value)}
                  className="w-full ml-2 text-lg focus:outline-none focus:ring-0"
                  placeholder="e.g., Susan"
                  onKeyDown={(e) => e.key === "Enter" && handleAddCard()}
                />
              </div>
               <div className="flex items-center border border-gray-300 rounded-full px-2 py-1">
                <label className="text-lg font-semibold">Hint:</label>
                <input
                  type="text"
                  value={Hint}
                  onChange={(e) => setHint(e.target.value)}
                  className="w-full ml-2 text-lg focus:outline-none focus:ring-0"
                  placeholder="He’s your grandson who loves soccer."
                  onKeyDown={(e) => e.key === "Enter" && handleAddCard()}
                />
              </div>

              <div className="flex justify-baseline">
                <button type="button" onClick={handleAddCard} className="bg-[#E7B904] flex items-center  rounded px-3 py-1 text-white">
                  <IoAdd className="text-2xl" /> Add
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}

        {!!cards.length && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-[#4D4D4D]">Added flashcards ({cards.length})</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {cards.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border p-2">
                  <img src={c.preview} alt="" className="h-16 w-16 rounded object-cover" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                   
                  </div>
                  <button type="button" onClick={() => removeCard(c.id)} className="ml-auto rounded border px-2 py-1 text-xs hover:bg-zinc-50">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => { cards.forEach(c => c.preview && URL.revokeObjectURL(c.preview)); setCards([]); clearWorkingCard(); }}
            className="rounded-xl font-semibold border-2 px-4 py-2 text-sm hover:bg-zinc-50 border-[#4D4D4D] "
          >
            Cancel
          </button>
          <button type="submit" disabled={!cards.length || saving} className="text-white font-semibold px-3 rounded-xl bg-[#E7B904]">
  {saving ? "Creating…" : "Create Memory Pack"}
</button>

        </div>
      </form>
    </div>
  );
}
