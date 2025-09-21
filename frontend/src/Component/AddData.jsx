// src/Page/addData.jsx
import React, { useEffect, useRef, useState } from "react";
import { CiCircleRemove } from "react-icons/ci";
import { RiImageEditLine } from "react-icons/ri";
import { IoAdd } from "react-icons/io5";

import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { decodeEventLog } from "viem";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contract";
import { useNavigate } from "react-router-dom";

export default function AddData() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [currentName, setCurrentName] = useState("");
  const [flashCardName, setFlashCardName] = useState("");
  const [Hint, setHint] = useState("");
  const [cards, setCards] = useState([]); // {id, file, preview, name, relation, hint}
  const [currentRelation, setCurrentRelation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const inputRef = useRef(null);
  const nameRef = useRef(null);

  const { isConnected, address: account } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const navigate = useNavigate();

  const MAX_MB = 10;

  function handleFiles(files) {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Please select an image file.");
    if (f.size > MAX_MB * 1024 * 1024) return setError(`File too large. Max ${MAX_MB} MB.`);
    setError("");
    setFile(f);
    setPreviewUrl((prev) => {
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
    if (inputRef.current) inputRef.current.value = "";
    if (nameRef.current) nameRef.current.value = "";
  }

  function handleAddCard() {
    if (!file) return setError("Please select an image first.");
    const nameToAdd = currentName.trim();
    if (!nameToAdd) return setError("Please enter a name.");

    const id = Date.now();
    const preview = previewUrl;

    setCards((prev) => [
      ...prev,
      {
        id,
        file,
        preview,
        name: nameToAdd,
        relation: currentRelation.trim(),
        hint: Hint.trim(),
      },
    ]);

    // reset inputs for next card
    setError("");
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
    setCards((prev) => {
      const card = prev.find((c) => c.id === id);
      if (card?.preview) URL.revokeObjectURL(card.preview);
      return prev.filter((c) => c.id !== id);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isConnected) return setError("Please connect your wallet first.");
    if (!cards.length) return setError("Please add at least one flashcard.");

    setSaving(true);
    setError("");

    try {
      // --- Phase 1: upload images + meta (no DB yet) ---
      console.log("→ uploading cards…");
      const fd = new FormData();
      fd.append(
        "meta",
        JSON.stringify(
          cards.map((c) => ({
            id: String(c.id),
            name: c.name,
            relation: c.relation || "",
            hint: c.hint || "",
          }))
        )
      );
      cards.forEach((c, i) => {
        if (c.file) fd.append(`image_${i}`, c.file, c.file.name || `card-${i}.jpg`);
      });

      const up = await fetch("/api/flashcards/batchUpsert", { method: "POST", body: fd });
      if (!up.ok) throw new Error("Upload failed.");
      const saved = await up.json(); // [{ id, name, relation, hint, imageUrl }]
      console.log("✓ uploaded:", saved);

      // --- Phase 2: build manifest -> CID (IPFS only) ---
      console.log("→ building manifest…");
      const man = await fetch("/api/manifest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: flashCardName || "Family Pack",
          cards: saved,
        }),
      });
      const { cid } = await man.json();
      if (!cid) throw new Error("Manifest CID not returned.");
      console.log("✓ CID:", cid, `https://ipfs.io/ipfs/${cid}`);

      // --- Network guard: ensure Base Sepolia ---
      if (chainId !== baseSepolia.id) {
        console.log("→ switching to Base Sepolia…");
        await switchChainAsync({ chainId: baseSepolia.id });
        console.log("✓ on Base Sepolia");
      }

      // --- Phase 3: on-chain createPack(cid, []) ---
      console.log("→ simulating tx…");
      const { request } = await publicClient.simulateContract({
        account: account,
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "createPack",
        args: [cid, []],
      });

      console.log("→ sending tx to Base Sepolia…");
      const txHash = await writeContractAsync(request);
      console.log("✓ tx hash:", txHash, `https://sepolia-explorer.base.org/tx/${txHash}`);

      // --- Phase 4: wait + parse logs (Transfer is the ground truth) ---
      console.log("→ waiting for receipt…");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      let tokenIdFromTransfer = null;
      let tokenIdFromPackCreated = null;

      for (const log of receipt.logs) {
        try {
          const { eventName, args } = decodeEventLog({
            abi: CONTRACT_ABI,
            data: log.data,
            topics: log.topics,
          });

          // ERC721 Transfer(from, to, tokenId)
          if (
            eventName === "Transfer" &&
            String(args?.from).toLowerCase() ===
              "0x0000000000000000000000000000000000000000"
          ) {
            tokenIdFromTransfer = Number(args.tokenId);
          }

          if (eventName === "PackCreated") {
            tokenIdFromPackCreated = Number(args.tokenId);
          }
        } catch {
          // ignore non-matching logs
        }
      }

      const tokenId = tokenIdFromTransfer ?? tokenIdFromPackCreated;
      if (tokenId == null) {
        throw new Error("Minted tokenId not found in logs.");
      }
      console.log("✓ tokenId:", tokenId);

      // --- Optional: read tokenURI, but don't block flow ---
      try {
        const onchainUri = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "tokenURI",
          args: [tokenId],
        });
        console.log("→ tokenURI:", onchainUri);
      } catch (uriErr) {
        // This can fail on some RPCs immediately after mint; not fatal
        console.warn("tokenURI not readable yet:", uriErr?.message);
      }

      // --- Phase 5: persist everything now that it's on-chain ---
      console.log("→ saving to DB…");
      const saveRes = await fetch("/api/households", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tokenId,
          contract: CONTRACT_ADDRESS,
          cid,
          title: flashCardName || "Family Pack",
          cards: saved,      // so your backend can link them if desired
          owner: account,    // <— save who minted/owns it
        }),
      });
      if (!saveRes.ok) {
        const t = await saveRes.text();
        throw new Error(`Backend save failed: ${t || saveRes.status}`);
      }
      const savedDoc = await saveRes.json();
      console.log("✓ saved household:", savedDoc);

      alert(`Created Memory Pack #${tokenId} on Base ✅`);
      navigate("/user"); // or navigate(`/packs/${tokenId}`)
    } catch (err) {
      console.error(err);
      setError(err?.shortMessage || err?.message || "Failed to create memory pack.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      cards.forEach((c) => c.preview && URL.revokeObjectURL(c.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[calc(90dvh-4rem)] flex items-start justify-center px-4 py-10 flex-col">
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
                  <label className="font-semibold">Relationship:</label>
                  <input
                    type="text"
                    className="ml-3 focus:outline-none focus:ring-0"
                    value={currentRelation}
                    onChange={(e) => setCurrentRelation(e.target.value)}
                    placeholder="e.g., Father"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => inputRef.current?.click()}>
                    <RiImageEditLine className="text-3xl" />
                  </button>
                  <button type="button" onClick={clearWorkingCard}>
                    <CiCircleRemove className="text-3xl" />
                  </button>
                  <input ref={inputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />
                </div>
              </div>

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
                <button
                  type="button"
                  onClick={handleAddCard}
                  className="bg-[#E7B904] flex items-center rounded px-3 py-1 text-white"
                >
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
                  <button
                    type="button"
                    onClick={() => removeCard(c.id)}
                    className="ml-auto rounded border px-2 py-1 text-xs hover:bg-zinc-50"
                  >
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
            onClick={() => {
              cards.forEach((c) => c.preview && URL.revokeObjectURL(c.preview));
              setCards([]);
              clearWorkingCard();
            }}
            className="rounded-xl font-semibold border-2 px-4 py-2 text-sm hover:bg-zinc-50 border-[#4D4D4D]"
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
