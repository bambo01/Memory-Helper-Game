// src/Page/EditFlashcards.jsx
import React, { useEffect, useRef, useState } from "react";
import { CiCircleRemove } from "react-icons/ci";
import { RiImageEditLine } from "react-icons/ri";

export default function EditFlashcards() {
  // Existing cards loaded from backend
  const [cards, setCards] = useState([]); // {id, name, relation, hint, imageUrl, file?, preview?, dirty?}
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // "Add new" working area
  const [newFile, setNewFile] = useState(null);
  const [newPreview, setNewPreview] = useState("");
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [newHint, setNewHint] = useState("");
  const newFileRef = useRef(null);

  const MAX_MB = 10;

  // ---- Load existing cards (replace with your API) ----
  useEffect(() => {
    (async () => {
      try {
        // Example response shape; adjust to your backend
        // [{ id: "susan", name:"Susan", relation:"Daughter", hint:"...", imageUrl:"/uploads/susan.jpg" }]
        const res = await fetch("/api/flashcards");
        const data = res.ok ? await res.json() : [];
        setCards(data);
      } catch {
        setCards([]);
      }
    })();
  }, []);

  // ---- Helpers ----
  function handleNewFile(files) {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Please select an image file.");
    if (f.size > MAX_MB * 1024 * 1024) return setError(`File too large. Max ${MAX_MB} MB.`);

    setError("");
    setNewFile(f);
    setNewPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }

  function addNewCard() {
    if (!newFile) return setError("Please choose an image.");
    if (!newName.trim()) return setError("Please enter a name.");

    const id = `temp-${Date.now()}`;
    const card = {
      id,
      name: newName.trim(),
      relation: newRelation.trim(),
      hint: newHint.trim(),
      imageUrl: "", // will be set by backend after upload
      file: newFile,
      preview: newPreview,
      dirty: true,
    };
    setCards((prev) => [card, ...prev]);
    // reset working area
    setNewFile(null);
    if (newPreview) URL.revokeObjectURL(newPreview);
    setNewPreview("");
    setNewName("");
    setNewRelation("");
    setNewHint("");
    if (newFileRef.current) newFileRef.current.value = "";
  }

  function removeCard(id) {
    setCards((prev) => {
      const c = prev.find((x) => x.id === id);
      if (c?.preview) URL.revokeObjectURL(c.preview);
      return prev.filter((x) => x.id !== id);
    });
  }

  function updateCardField(id, field, value) {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value, dirty: true } : c))
    );
  }

  function changeCardImage(id, file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please select an image file.");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`File too large. Max ${MAX_MB} MB.`);

    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (c.preview) URL.revokeObjectURL(c.preview);
        const preview = URL.createObjectURL(file);
        return { ...c, file, preview, dirty: true };
      })
    );
  }

  // ---- Save all (batch upsert) ----
  async function onSaveAll(e) {
    e.preventDefault();
    const dirty = cards.filter((c) => c.dirty);
    if (!dirty.length) return setError("No changes to save.");

    setSaving(true);
    setError("");

    try {
      // Example: send files + JSON metadata in one request
      const fd = new FormData();
      fd.append(
        "meta",
        JSON.stringify(
          dirty.map((c) => ({
            id: c.id.toString(),
            name: c.name,
            relation: c.relation || "",
            hint: c.hint || "",
          }))
        )
      );
      dirty.forEach((c, i) => {
        if (c.file) fd.append(`image_${i}`, c.file, c.file.name || `card-${i}.jpg`);
      });

      const res = await fetch("/api/flashcards/batchUpsert", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Save failed");

      // Backend should return updated cards with final imageUrl & ids (for temps)
      const updated = await res.json(); // [{id, name, relation, hint, imageUrl}]
      // Merge back into state
      setCards((prev) => {
        // Map by id; handle temp-id replacement if backend sent final ids
        const byId = Object.fromEntries(prev.map((c) => [c.id, c]));
        updated.forEach((u) => {
          // If server replaced a temp id, remove old key and insert new
          const matchKey = byId[u.id] ? u.id : (Object.keys(byId).find(k => k.startsWith("temp-") && byId[k].name === u.name) || u.id);
          byId[matchKey] = { ...byId[matchKey], ...u, file: undefined, dirty: false, preview: undefined };
        });
        return Object.values(byId);
      });
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // ---- Cleanup previews on unmount ----
  useEffect(() => {
    return () => {
      if (newPreview) URL.revokeObjectURL(newPreview);
      cards.forEach((c) => c.preview && URL.revokeObjectURL(c.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-start justify-center px-4 py-10 ">
      <form
        onSubmit={onSaveAll}
        className="w-full max-w-4xl space-y-8 rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-[0_4px_4px_rgba(0,0,0,1)]"
      >
        {/* Add New --------------------------------------------------------- */}
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">Add flashcards</h1>
          <p className="text-sm opacity-80">PNG or JPG, up to {MAX_MB} MB.</p>

          {!newPreview ? (
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center hover:bg-zinc-50"
              onClick={() => newFileRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && newFileRef.current?.click()
              }
            >
              <svg width="32" height="32" viewBox="0 0 24 24" className="opacity-70">
                <path fill="currentColor" d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2z" />
                <path fill="currentColor" d="M17 8V4h-2v4h-4v2h4v4h2v-4h4V8z" />
              </svg>
              <div className="text-sm"><span className="font-medium">Click to upload</span> or drag and drop</div>
              <input
                ref={newFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleNewFile(e.target.files)}
                onDrop={(e) => { e.preventDefault(); handleNewFile(e.dataTransfer.files); }}
                onDragOver={(e) => e.preventDefault()}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-300">
              <div className="aspect-[16/9] w-full overflow-hidden rounded-t-2xl bg-zinc-100">
                <img src={newPreview} alt="Preview" className="h-full w-full object-cover" />
              </div>
              <div className="grid gap-3 p-3 sm:grid-cols-2">
                <div className="flex items-center border border-gray-300 rounded-full px-2 py-1">
                  <label className="text-sm font-medium">Name:</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full ml-2 text-sm focus:outline-none focus:ring-0"
                    placeholder="e.g., Susan"
                  />
                </div>
                <div className="flex items-center border border-gray-300 rounded-full px-2 py-1">
                  <label className="text-sm font-medium">Relation:</label>
                  <input
                    value={newRelation}
                    onChange={(e) => setNewRelation(e.target.value)}
                    className="w-full ml-2 text-sm focus:outline-none focus:ring-0"
                    placeholder="e.g., Daughter"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center border border-gray-300 rounded-full px-2 py-1">
                  <label className="text-sm font-medium">Hint:</label>
                  <input
                    value={newHint}
                    onChange={(e) => setNewHint(e.target.value)}
                    className="w-full ml-2 text-sm focus:outline-none focus:ring-0"
                    placeholder="Your daughter who calls every Sunday."
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded border px-3 py-2 text-sm"
                    onClick={() => {
                      if (newPreview) URL.revokeObjectURL(newPreview);
                      setNewPreview(""); setNewFile(null); setNewName(""); setNewRelation(""); setNewHint("");
                      if (newFileRef.current) newFileRef.current.value = "";
                    }}
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={addNewCard}
                    className="bg-blue-500 hover:bg-blue-600 rounded px-3 py-2 text-white text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Edit Existing --------------------------------------------------- */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Edit flashcards</h2>

          {!cards.length ? (
            <div className="text-sm opacity-70">No flashcards yet.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {cards.map((c) => (
                <div key={c.id} className="rounded-xl border p-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded">
                      <img
                        src={c.preview || c.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <label className="inline-flex items-center gap-1 text-xs cursor-pointer">
                      <RiImageEditLine className="text-lg" />
                      <span>Change image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && changeCardImage(c.id, e.target.files[0])}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeCard(c.id)}
                      className="ml-auto rounded border px-2 py-1 text-xs hover:bg-zinc-50"
                      title="Remove"
                    >
                      <CiCircleRemove className="text-xl" />
                    </button>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center border border-gray-300 rounded-full px-2 py-1">
                      <label className="text-xs font-medium">Name:</label>
                      <input
                        value={c.name}
                        onChange={(e) => updateCardField(c.id, "name", e.target.value)}
                        className="w-full ml-2 text-sm focus:outline-none focus:ring-0"
                      />
                    </div>
                    <div className="flex items-center border border-gray-300 rounded-full px-2 py-1">
                      <label className="text-xs font-medium">Relation:</label>
                      <input
                        value={c.relation || ""}
                        onChange={(e) => updateCardField(c.id, "relation", e.target.value)}
                        className="w-full ml-2 text-sm focus:outline-none focus:ring-0"
                      />
                    </div>
                    <div className="flex items-center border border-gray-300 rounded-full px-2 py-1">
                      <label className="text-xs font-medium">Hint:</label>
                      <input
                        value={c.hint || ""}
                        onChange={(e) => updateCardField(c.id, "hint", e.target.value)}
                        className="w-full ml-2 text-sm focus:outline-none focus:ring-0"
                        placeholder="He’s your grandson who loves soccer."
                      />
                    </div>
                  </div>

                  {c.dirty && (
                    <div className="text-[10px] uppercase tracking-wide text-blue-600">
                      Unsaved changes
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Errors + Actions ------------------------------------------------ */}
        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-xl border-2 px-4 py-2 border-[#4D4D4D] text-sm hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#E7B904] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save all"}
          </button>
        </div>
      </form>
    </div>
  );
}
