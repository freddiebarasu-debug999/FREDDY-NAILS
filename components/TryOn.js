"use client";

import { useEffect, useRef, useState } from "react";
import { GEL_COLOURS } from "@/lib/gelColours";
import { TRY_SHAPES, TRY_FINISHES } from "@/lib/nailShapes";
import { drawNails } from "@/lib/tryOnRenderer";
import NailShapeIcon from "@/components/NailShapeIcon";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MAX_SIDE = 1200;

let landmarkerPromise = null;

// The hand-finder runs inside the visitor's browser. It is only downloaded
// when someone opens this page and picks a photo.
function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async function () {
      const mod = await import(
        /* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs"
      );
      const vision = await mod.FilesetResolver.forVisionTasks(WASM_URL);
      return await mod.HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: "IMAGE",
        numHands: 2,
        minHandDetectionConfidence: 0.35,
        minHandPresenceConfidence: 0.35,
      });
    })().catch(function (err) {
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
}

async function loadBitmap(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (e) {
      // fall back below
    }
  }
  return await new Promise(function (resolve, reject) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as a photo."));
    };
    img.src = url;
  });
}

function toHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map(function (v) {
        return v.toString(16).padStart(2, "0");
      })
      .join("")
  );
}

function Slider({ label, value, min, max, step, onChange }) {
  return (
    <label className="block text-xs font-semibold text-[#c9c0b6]">
      <span className="flex justify-between">
        <span>{label}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={function (e) {
          onChange(Number(e.target.value));
        }}
        className="mt-1 w-full accent-[#d6b36a]"
      />
    </label>
  );
}

export default function TryOn() {
  const canvasRef = useRef(null);
  const handInputRef = useRef(null);
  const designInputRef = useRef(null);

  const [photo, setPhoto] = useState(null); // { canvas, width, height }
  const [hands, setHands] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | found | none | error
  const [message, setMessage] = useState("");

  const [shapeName, setShapeName] = useState("Almond");
  const [finish, setFinish] = useState("Gloss");
  const [colour, setColour] = useState("#d9908c");

  const [designImg, setDesignImg] = useState(null);
  const [designUrl, setDesignUrl] = useState("");
  const [usePattern, setUsePattern] = useState(false);
  const [zoom, setZoom] = useState(1.6);

  const [size, setSize] = useState(1);
  const [length, setLength] = useState(1);
  const [shift, setShift] = useState(0);
  const [includeThumb, setIncludeThumb] = useState(true);
  const [showAfter, setShowAfter] = useState(true);

  const shape =
    TRY_SHAPES.find(function (s) {
      return s.name === shapeName;
    }) || TRY_SHAPES[0];

  // Draw the photo and the nails whenever anything changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photo) return;
    canvas.width = photo.width;
    canvas.height = photo.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(photo.canvas, 0, 0);
    if (showAfter && hands.length > 0) {
      drawNails(ctx, hands, photo.width, photo.height, {
        shape: shape,
        finish: finish,
        colour: colour,
        size: size,
        length: length,
        shift: shift,
        includeThumb: includeThumb,
        pattern: usePattern && designImg ? { image: designImg, zoom: zoom } : null,
      });
    }
  }, [photo, hands, shape, finish, colour, size, length, shift, includeThumb, showAfter, usePattern, designImg, zoom]);

  async function onHandFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type || file.type.indexOf("image/") !== 0) {
      setStatus("error");
      setMessage("Please choose a photo.");
      return;
    }

    setStatus("loading");
    setMessage("Finding your hand. The first time can take a few seconds.");
    setHands([]);
    setShowAfter(true);

    try {
      const bitmap = await loadBitmap(file);
      const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(bitmap.height * scale);
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      off.getContext("2d").drawImage(bitmap, 0, 0, w, h);
      if (bitmap.close) bitmap.close();
      setPhoto({ canvas: off, width: w, height: h });

      const landmarker = await getLandmarker();
      const result = landmarker.detect(off);
      const found = (result && result.landmarks) || [];

      if (found.length === 0) {
        setStatus("none");
        setMessage(
          "We couldn't find a hand. Try the back of your hand with your fingers apart, in good light."
        );
      } else {
        setHands(found);
        setStatus("found");
        setMessage(found.length > 1 ? "Found both hands." : "Found your hand.");
      }
    } catch (err) {
      setStatus("error");
      setMessage(
        "Something went wrong loading the hand finder. Check your internet connection and try again."
      );
    }
  }

  async function onDesignFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type || file.type.indexOf("image/") !== 0) return;
    try {
      const bitmap = await loadBitmap(file);
      const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(bitmap.height * scale);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(bitmap, 0, 0, w, h);
      if (bitmap.close) bitmap.close();
      setDesignImg(c);
      setDesignUrl(c.toDataURL("image/jpeg", 0.85));
      setUsePattern(false);
    } catch (err) {
      // ignore unreadable design photos
    }
  }

  // Tap the design photo to pick a colour from it
  function pickColour(e) {
    if (!designImg) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * (designImg.width - 1));
    const y = Math.round(((e.clientY - rect.top) / rect.height) * (designImg.height - 1));
    const data = designImg.getContext("2d").getImageData(
      Math.max(0, x - 2),
      Math.max(0, y - 2),
      5,
      5
    ).data;
    let r = 0;
    let g = 0;
    let b = 0;
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    setColour(toHex(Math.round(r / n), Math.round(g / n), Math.round(b / n)));
    setUsePattern(false);
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      function (blob) {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "freddy-nails-preview.jpg";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 1000);
      },
      "image/jpeg",
      0.92
    );
  }

  function bookThisLook() {
    const named = GEL_COLOURS.find(function (c) {
      return c.hex.toLowerCase() === colour.toLowerCase();
    });
    const colourText =
      usePattern && designImg
        ? "my own design photo"
        : named
        ? named.name + " (" + named.brand + ")"
        : "custom colour " + colour;
    const note =
      "Try-on preview: " + shapeName + " shape, " + finish + " finish, " + colourText + ".";
    try {
      window.localStorage.setItem(
        "freddynails_tryon",
        JSON.stringify({ shape: shapeName, note: note })
      );
    } catch (e) {
      // ignore
    }
    window.location.assign("/account/book");
  }

  const statusColour =
    status === "found" ? "text-[#8fd19e]" : status === "loading" ? "text-[#d6b36a]" : "text-[#e6b8a8]";

  return (
    <div>
      {/* Step 1: the hand */}
      <section className="rounded-[20px] border border-[#d6b36a]/20 bg-white/[0.03] p-5">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
          Step 1
        </p>
        <h2 className="mt-1 font-serif text-xl text-[#f4eee6]">Your hand</h2>
        <p className="mt-1 text-sm leading-relaxed text-[#c9c0b6]">
          Take or choose a photo of the <strong>back of your hand</strong>, fingers a little
          apart, in good light.
        </p>

        <input
          ref={handInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onHandFile}
        />
        <button
          type="button"
          onClick={function () {
            if (handInputRef.current) handInputRef.current.click();
          }}
          className="mt-4 w-full rounded-full bg-[#d6b36a] py-3.5 text-sm font-bold text-[#11100f] transition-transform hover:scale-[1.01] active:scale-95"
        >
          {photo ? "Choose a different photo" : "Add a photo of my hand"}
        </button>

        {message && (
          <p role="status" className={"mt-3 text-xs " + statusColour}>
            {message}
          </p>
        )}
        <p className="mt-3 text-[0.7rem] leading-relaxed text-[#8f877e]">
          Your photos stay on your phone. They are not uploaded or saved.
        </p>
      </section>

      {/* Preview */}
      {photo && (
        <section className="sticky top-0 z-20 mt-6 rounded-[20px] border border-[#d6b36a]/30 bg-[#0c0b0a]/95 p-3 backdrop-blur">
          <div className="relative overflow-hidden rounded-2xl bg-black">
            <canvas
              ref={canvasRef}
              className="mx-auto block max-h-[46vh] w-auto max-w-full"
              aria-label="Your hand with the chosen nail design"
            />
            {status === "loading" && (
              <div className="absolute inset-0 grid place-items-center bg-black/55">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#d6b36a] border-t-transparent" />
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex rounded-full border border-white/20 p-1">
              <button
                type="button"
                onClick={function () {
                  setShowAfter(false);
                }}
                className={
                  "rounded-full px-4 py-1.5 text-xs font-semibold " +
                  (!showAfter ? "bg-[#d6b36a] text-[#11100f]" : "text-[#c9c0b6]")
                }
              >
                Before
              </button>
              <button
                type="button"
                onClick={function () {
                  setShowAfter(true);
                }}
                className={
                  "rounded-full px-4 py-1.5 text-xs font-semibold " +
                  (showAfter ? "bg-[#d6b36a] text-[#11100f]" : "text-[#c9c0b6]")
                }
              >
                After
              </button>
            </div>
            <button
              type="button"
              onClick={download}
              className="rounded-full border border-[#d6b36a]/50 px-4 py-2 text-xs font-semibold text-[#d6b36a]"
            >
              Save picture
            </button>
          </div>
        </section>
      )}

      {/* Step 2: the design */}
      <section className="mt-6 rounded-[20px] border border-[#d6b36a]/20 bg-white/[0.03] p-5">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
          Step 2
        </p>
        <h2 className="mt-1 font-serif text-xl text-[#f4eee6]">Your design</h2>

        <p className="mt-4 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#a79a87]">Shape</p>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {TRY_SHAPES.map(function (s) {
            const on = s.name === shapeName;
            return (
              <button
                key={s.name}
                type="button"
                aria-pressed={on}
                onClick={function () {
                  setShapeName(s.name);
                }}
                className={
                  "rounded-xl border px-1 py-2 text-center transition-colors " +
                  (on
                    ? "border-[#d6b36a] bg-[#d6b36a]/10 text-[#d6b36a]"
                    : "border-white/15 text-[#f4eee6]")
                }
              >
                <NailShapeIcon shape={s.name} selected={on} height={50} />
                <span className="mt-1 block text-[0.7rem] font-semibold">{s.name}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#a79a87]">Finish</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TRY_FINISHES.map(function (f) {
            const on = f === finish;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={function () {
                  setFinish(f);
                }}
                className={
                  "rounded-full border px-4 py-2 text-xs font-semibold " +
                  (on
                    ? "border-[#d6b36a] bg-[#d6b36a] text-[#11100f]"
                    : "border-white/20 text-[#f4eee6]")
                }
              >
                {f}
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#a79a87]">Colour</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {GEL_COLOURS.map(function (c) {
            const on = !usePattern && c.hex.toLowerCase() === colour.toLowerCase();
            return (
              <button
                key={c.name}
                type="button"
                title={c.name}
                aria-label={c.name}
                aria-pressed={on}
                onClick={function () {
                  setColour(c.hex);
                  setUsePattern(false);
                }}
                className={
                  "h-9 w-9 rounded-full border-2 transition-transform active:scale-90 " +
                  (on ? "scale-110 border-[#d6b36a]" : "border-white/20")
                }
                style={{ background: c.hex }}
              />
            );
          })}
          <label className="flex h-9 items-center gap-2 rounded-full border border-white/20 px-3 text-xs font-semibold text-[#c9c0b6]">
            Any colour
            <input
              type="color"
              value={colour}
              onChange={function (e) {
                setColour(e.target.value);
                setUsePattern(false);
              }}
              className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
              aria-label="Choose any colour"
            />
          </label>
        </div>

        {/* design photo */}
        <p className="mt-5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#a79a87]">
          Or use a design you love
        </p>
        <input
          ref={designInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onDesignFile}
        />
        {!designUrl ? (
          <button
            type="button"
            onClick={function () {
              if (designInputRef.current) designInputRef.current.click();
            }}
            className="mt-2 w-full rounded-2xl border border-dashed border-[#d6b36a]/60 bg-[#d6b36a]/5 px-4 py-5 text-left"
          >
            <span className="block text-sm font-bold text-[#f4eee6]">Upload a design photo</span>
            <span className="mt-1 block text-xs text-[#a79a87]">
              From Instagram, Pinterest or your camera roll.
            </span>
          </button>
        ) : (
          <div className="mt-2 rounded-2xl border border-white/15 p-3">
            <div className="flex gap-3">
              <img
                src={designUrl}
                alt="Your design photo. Tap it to pick a colour."
                onClick={pickColour}
                className="h-28 w-28 shrink-0 cursor-crosshair rounded-xl object-cover"
              />
              <div className="text-xs leading-relaxed text-[#c9c0b6]">
                <p>
                  <strong className="text-[#f4eee6]">Tap the photo</strong> to pick a colour from
                  it, or use the photo itself as the pattern.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={function () {
                      setUsePattern(!usePattern);
                    }}
                    className={
                      "rounded-full border px-3 py-1.5 font-semibold " +
                      (usePattern
                        ? "border-[#d6b36a] bg-[#d6b36a] text-[#11100f]"
                        : "border-white/25 text-[#f4eee6]")
                    }
                  >
                    {usePattern ? "Using as pattern" : "Use as pattern"}
                  </button>
                  <button
                    type="button"
                    onClick={function () {
                      if (designInputRef.current) designInputRef.current.click();
                    }}
                    className="rounded-full border border-white/25 px-3 py-1.5 font-semibold text-[#f4eee6]"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
            {usePattern && (
              <div className="mt-3">
                <Slider label="Zoom in on the design" value={zoom} min={1} max={4} step={0.1} onChange={setZoom} />
              </div>
            )}
          </div>
        )}
      </section>

      {/* Fine tune */}
      {photo && (
        <section className="mt-6 rounded-[20px] border border-[#d6b36a]/20 bg-white/[0.03] p-5">
          <h2 className="font-serif text-xl text-[#f4eee6]">Fine tune</h2>
          <p className="mt-1 text-xs text-[#a79a87]">
            If a nail sits a little off, nudge it here.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Slider label="Nail width" value={size} min={0.7} max={1.4} step={0.02} onChange={setSize} />
            <Slider label="Nail length" value={length} min={0.6} max={1.5} step={0.02} onChange={setLength} />
            <Slider label="Move along finger" value={shift} min={-0.2} max={0.2} step={0.01} onChange={setShift} />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-[#c9c0b6]">
            <input
              type="checkbox"
              checked={includeThumb}
              onChange={function (e) {
                setIncludeThumb(e.target.checked);
              }}
              className="h-4 w-4 accent-[#d6b36a]"
            />
            Include thumbs
          </label>
        </section>
      )}

      {/* Book */}
      <section className="mt-6 text-center">
        <button
          type="button"
          onClick={bookThisLook}
          className="w-full rounded-full bg-[#d6b36a] py-4 text-sm font-bold text-[#11100f] transition-transform hover:scale-[1.01] active:scale-95 sm:w-auto sm:px-12"
        >
          Book this look
        </button>
        <p className="mt-3 text-xs leading-relaxed text-[#8f877e]">
          This is a preview, so real results can look slightly different. Your choices are added to
          your booking notes.
        </p>
      </section>
    </div>
  );
}
