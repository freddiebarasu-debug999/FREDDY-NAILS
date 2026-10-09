"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { checkImageFile, resizeToJpeg } from "@/lib/imageTools";

export default function AvatarUploader({ user, initials, tier }) {
  const inputRef = useRef(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setUrl((user && user.user_metadata && user.user_metadata.avatar_url) || "");
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function onPick(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file || !user) return;

    const problem = checkImageFile(file, 20);
    if (problem) {
      setToast(problem);
      return;
    }

    setBusy(true);
    try {
      const blob = await resizeToJpeg(file, { maxSide: 512, square: true, quality: 0.85 });
      const path = user.id + "/avatar.jpg";

      const up = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (up.error) throw new Error("Upload failed. Please try again.");

      const pub = supabase.storage.from("avatars").getPublicUrl(path);
      const finalUrl = pub.data.publicUrl + "?v=" + Date.now();

      const upd = await supabase.auth.updateUser({ data: { avatar_url: finalUrl } });
      if (upd.error) throw new Error("Could not save your photo. Please try again.");

      setUrl(finalUrl);
      setToast("Looking good! Your photo is saved.");
    } catch (err) {
      setToast((err && err.message) || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const glow =
    tier === "elite"
      ? "0 0 0 4px rgba(214,179,106,0.14), 0 0 28px rgba(214,179,106,0.35)"
      : "0 0 0 4px rgba(214,179,106,0.07)";

  return (
    <div className="relative h-16 w-16 shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current && inputRef.current.click()}
        disabled={busy}
        aria-label="Change your profile photo"
        className="group relative block h-16 w-16 overflow-hidden rounded-full border-[1.5px] border-[#d6b36a]/60 bg-gradient-to-br from-[#d6b36a]/25 to-[#ad8a4e]/10 transition-transform duration-300 hover:scale-105 active:scale-95 disabled:opacity-70"
        style={{ boxShadow: glow }}
      >
        {url ? (
          <img
            src={url}
            alt="Your profile"
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="grid h-full w-full place-items-center font-serif text-xl tracking-wide text-[#d6b36a]">
            {initials}
          </span>
        )}

        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-black/60">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#d6b36a] border-t-transparent" />
          </span>
        )}
      </button>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border border-[#11100f] bg-[#d6b36a] text-[#11100f] shadow"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-[80] w-[min(90vw,380px)] -translate-x-1/2 rounded-xl border border-[#d6b36a]/40 bg-[#141210] px-4 py-3 text-center text-sm text-[#f4eee6] shadow-2xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
