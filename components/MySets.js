"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { checkImageFile, resizeToJpeg } from "@/lib/imageTools";

const MAX_SETS = 30;

function todayString() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

function prettyDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

export default function MySets({ user }) {
  const inputRef = useRef(null);
  const touchX = useRef(null);

  const [sets, setSets] = useState([]);
  const [urls, setUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [label, setLabel] = useState("");
  const [takenOn, setTakenOn] = useState(todayString());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [openIndex, setOpenIndex] = useState(-1);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async function () {
    if (!user) return;
    setLoadError("");
    const res = await supabase
      .from("client_sets")
      .select("id, image_path, label, taken_on, created_at")
      .order("taken_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(60);

    if (res.error) {
      setLoadError("We couldn't load your sets right now.");
      setLoading(false);
      return;
    }

    const rows = res.data || [];
    setSets(rows);

    if (rows.length) {
      const signed = await supabase.storage
        .from("sets")
        .createSignedUrls(
          rows.map(function (r) {
            return r.image_path;
          }),
          3600
        );
      const map = {};
      (signed.data || []).forEach(function (item) {
        if (item.signedUrl) map[item.path] = item.signedUrl;
      });
      setUrls(map);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Keyboard controls for the viewer
  useEffect(() => {
    if (openIndex < 0) return;
    function onKey(e) {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function closeViewer() {
    setOpenIndex(-1);
    setConfirmDelete(false);
  }

  function step(dir) {
    setConfirmDelete(false);
    setOpenIndex(function (i) {
      if (i < 0 || !sets.length) return i;
      return (i + dir + sets.length) % sets.length;
    });
  }

  function onPick(e) {
    const picked = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!picked) return;
    const problem = checkImageFile(picked, 20);
    if (problem) {
      setFormError(problem);
      return;
    }
    setFormError("");
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
    setLabel("");
    setTakenOn(todayString());
  }

  function closeSheet() {
    if (saving) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    setFormError("");
  }

  async function save() {
    if (!file || !user) return;
    setSaving(true);
    setFormError("");
    try {
      const blob = await resizeToJpeg(file, { maxSide: 1280, quality: 0.85 });
      const path = user.id + "/" + Date.now() + ".jpg";

      const up = await supabase.storage
        .from("sets")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) throw new Error("Upload failed. Please try again.");

      const ins = await supabase.from("client_sets").insert({
        profile_id: user.id,
        image_path: path,
        label: label.trim() ? label.trim().slice(0, 80) : null,
        taken_on: takenOn || todayString(),
      });
      if (ins.error) {
        await supabase.storage.from("sets").remove([path]);
        throw new Error("Could not save your set. Please try again.");
      }

      if (preview) URL.revokeObjectURL(preview);
      setFile(null);
      setPreview("");
      await load();
    } catch (err) {
      setFormError((err && err.message) || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const item = sets[openIndex];
    if (!item) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await supabase.storage.from("sets").remove([item.image_path]);
    await supabase.from("client_sets").delete().eq("id", item.id);
    closeViewer();
    await load();
  }

  const current = openIndex >= 0 ? sets[openIndex] : null;
  const full = sets.length >= MAX_SETS;

  return (
    <section
      id="my-sets"
      aria-labelledby="my-sets-title"
      className="mt-9 scroll-mt-6 rounded-[20px] border border-[#d6b36a]/20 bg-white/[0.03] p-5 md:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
            My sets
          </p>
          <h2 id="my-sets-title" className="mt-2 font-serif text-xl text-[#f4eee6]">
            Your nail diary
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[#c9c0b6]">
            Keep photos of your favourite sets. Only you can see them.
          </p>
        </div>

        <button
          type="button"
          disabled={full}
          onClick={() => inputRef.current && inputRef.current.click()}
          className="shrink-0 rounded-full bg-[#ad8a4e] px-4 py-2 text-xs font-semibold text-[#0c0b0a] transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          + Add a set
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
      />

      {full && (
        <p className="mt-3 text-xs text-[#e6b8a8]">
          You&apos;ve reached {MAX_SETS} saved sets. Delete one to add another.
        </p>
      )}

      <div className="mt-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {[0, 1, 2].map(function (i) {
              return (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-2xl bg-white/[0.06]"
                />
              );
            })}
          </div>
        ) : loadError ? (
          <p className="text-sm text-[#e6b8a8]">{loadError}</p>
        ) : sets.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current && inputRef.current.click()}
            className="group flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-[#d6b36a]/40 px-6 py-10 text-center transition-colors hover:border-[#d6b36a]"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#d6b36a]/15 text-[#d6b36a] transition-transform duration-300 group-hover:scale-110">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </span>
            <span className="font-serif text-lg text-[#f4eee6]">Add your first set</span>
            <span className="max-w-[28ch] text-xs leading-relaxed text-[#a79a87]">
              Snap your nails after every visit and build your own look book.
            </span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {sets.map(function (s, i) {
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={function () {
                    setOpenIndex(i);
                    setConfirmDelete(false);
                  }}
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-[#181614] transition-all duration-300 hover:-translate-y-1 hover:border-[#d6b36a]/60 active:scale-[0.97]"
                >
                  {urls[s.image_path] ? (
                    <img
                      src={urls[s.image_path]}
                      alt={s.label || "Nail set"}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : null}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2.5 pt-8 text-left">
                    <span className="block truncate text-xs font-semibold text-[#f4eee6]">
                      {s.label || "Nail set"}
                    </span>
                    <span className="block text-[0.68rem] text-[#d6b36a]">
                      {prettyDate(s.taken_on)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Add-a-set sheet */}
      {file && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 md:items-center md:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Add a set"
          onClick={closeSheet}
        >
          <div
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-[#d6b36a]/30 bg-[#141210] p-5 md:rounded-3xl"
            onClick={function (e) {
              e.stopPropagation();
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#f4eee6]">Add to your sets</h3>
              <button
                type="button"
                onClick={closeSheet}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-xl text-[#c9c0b6] hover:text-white"
              >
                ×
              </button>
            </div>

            <img
              src={preview}
              alt="Preview of your photo"
              className="mt-4 max-h-[42vh] w-full rounded-2xl object-cover"
            />

            <label className="mt-4 block text-xs font-bold uppercase tracking-[0.12em] text-[#c9c0b6]">
              Name this set (optional)
              <input
                type="text"
                value={label}
                maxLength={80}
                onChange={function (e) {
                  setLabel(e.target.value);
                }}
                placeholder="e.g. Chrome French tips"
                className="mt-2 w-full rounded-md border border-white/[0.12] bg-[#181614] px-4 py-3 text-sm font-normal normal-case tracking-normal text-[#f4eee6] placeholder:text-[#8f877e] focus:border-[#d6b36a]/60 focus:outline-none"
              />
            </label>

            <label className="mt-4 block text-xs font-bold uppercase tracking-[0.12em] text-[#c9c0b6]">
              Date
              <input
                type="date"
                value={takenOn}
                max={todayString()}
                onChange={function (e) {
                  setTakenOn(e.target.value);
                }}
                className="mt-2 w-full rounded-md border border-white/[0.12] bg-[#181614] px-4 py-3 text-sm font-normal text-[#f4eee6] focus:border-[#d6b36a]/60 focus:outline-none"
              />
            </label>

            {formError && <p className="mt-3 text-xs text-[#e6b8a8]">{formError}</p>}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex-1 rounded-full bg-[#ad8a4e] py-3 text-sm font-semibold text-[#0c0b0a] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save set"}
              </button>
              <button
                type="button"
                onClick={closeSheet}
                disabled={saving}
                className="rounded-full border border-white/20 px-5 py-3 text-sm text-[#c9c0b6]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {formError && !file && (
        <p className="mt-3 text-xs text-[#e6b8a8]">{formError}</p>
      )}

      {/* Viewer */}
      {current && (
        <div
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Your nail set"
          onClick={closeViewer}
          onTouchStart={function (e) {
            touchX.current = e.touches[0].clientX;
          }}
          onTouchEnd={function (e) {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1);
          }}
        >
          <button
            type="button"
            onClick={closeViewer}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-2xl text-white"
          >
            ×
          </button>

          {sets.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous set"
                onClick={function (e) {
                  e.stopPropagation();
                  step(-1);
                }}
                className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-2xl text-white"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next set"
                onClick={function (e) {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-2xl text-white"
              >
                ›
              </button>
            </>
          )}

          <div
            className="flex max-h-full w-full max-w-md flex-col items-center"
            onClick={function (e) {
              e.stopPropagation();
            }}
          >
            {urls[current.image_path] && (
              <img
                src={urls[current.image_path]}
                alt={current.label || "Nail set"}
                className="max-h-[68vh] w-full rounded-2xl object-contain"
              />
            )}
            <p className="mt-4 font-serif text-lg text-[#f4eee6]">
              {current.label || "Nail set"}
            </p>
            <p className="text-sm text-[#d6b36a]">{prettyDate(current.taken_on)}</p>

            <button
              type="button"
              onClick={remove}
              className="mt-4 rounded-full border border-white/20 px-5 py-2 text-xs text-[#c9c0b6] hover:border-[#e6b8a8] hover:text-[#e6b8a8]"
            >
              {confirmDelete ? "Tap again to delete this photo" : "Delete photo"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
