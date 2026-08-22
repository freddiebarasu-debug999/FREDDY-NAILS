"use client";

import { useState, useRef } from "react";
import Image from "next/image";

const GALLERY = [
  { name: "Purple Chrome Ombré", src: "/gallery/gallery-1.jpg" },
  { name: "Black & White French", src: "/gallery/gallery-2.jpg" },
  { name: "Gold Outline & Pearls", src: "/gallery/gallery-3.jpg" },
  { name: "Floral Stiletto Art", src: "/gallery/gallery-4.jpg" },
  { name: "Classic Pink Square", src: "/gallery/gallery-5.jpg" },
  { name: "Mauve French Square", src: "/gallery/gallery-6.jpg" },
  { name: "Lilac Square Set", src: "/gallery/gallery-7.jpg" },
  { name: "Leopard French Cherry", src: "/gallery/gallery-8.jpg" },
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function ChatBot() {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! 💅 I'm Freddy's Nail Muse. Tell me what kind of nails you're thinking about, or paste/upload a photo of your inspo and I'll estimate the price for you.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef(null);

  function findGalleryDesign(text, previousMessages) {
    const lowerText = text.toLowerCase();

    const alreadyShown = previousMessages
      .filter((message) => message.imageName)
      .map((message) => message.imageName);

    const matchingDesigns = GALLERY.filter((item) =>
      lowerText.includes(item.name.toLowerCase())
    );

    const newDesign = matchingDesigns.find(
      (item) => !alreadyShown.includes(item.name)
    );

    if (newDesign) {
      return newDesign;
    }

    return matchingDesigns[0] || null;
  }

  async function searchInspiration(query) {
    try {
      const response = await fetch(
        `/api/inspiration?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return data.photos || [];
    } catch (error) {
      console.error("Inspiration search error:", error);
      return [];
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);

      reader.onerror = () =>
        reject(new Error("Could not read the image."));

      reader.readAsDataURL(file);
    });
  }

  async function handleImageFile(file) {
    setImageError("");

    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(
        "That image is a bit large — please use one under 5MB."
      );
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPendingImage(dataUrl);
    } catch (error) {
      console.error("Image read error:", error);
      setImageError("Couldn't load that image. Please try another.");
    }
  }

  function handleFileInputChange(e) {
    const file = e.target.files?.[0];

    if (file) {
      handleImageFile(file);
    }

    e.target.value = "";
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items;

    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();

        if (file) {
          e.preventDefault();
          handleImageFile(file);
        }

        break;
      }
    }
  }

  function removePendingImage() {
    setPendingImage(null);
    setImageError("");
  }

  async function sendMessage(e) {
    e.preventDefault();

    const text = input.trim();

    if ((!text && !pendingImage) || loading) {
      return;
    }

    const imageToSend = pendingImage;

    const newMessages = [
      ...messages,
      {
        role: "user",
        content:
          text ||
          (imageToSend
            ? "Here's a photo of what I have in mind."
            : ""),
        image: imageToSend || null,
      },
    ];

    setMessages(newMessages);
    setInput("");
    setPendingImage(null);
    setLoading(true);
    setImageError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages.map(({ role, content }) => ({
            role,
            content,
          })),
          image: imageToSend || undefined,
        }),
      });

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          `The chatbot server returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Chatbot request failed (${response.status}).`
        );
      }

      if (!data?.message) {
        throw new Error(
          "The chatbot did not return a message."
        );
      }

      if (imageToSend) {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: data.message,
          },
        ]);
      } else {
        const galleryDesign = findGalleryDesign(
          data.message,
          messages
        );

        const inspirationQuery = `${data.message
          .replace(/[#*_]/g, "")
          .slice(0, 180)} nail design manicure`;

        const inspirationPhotos =
          await searchInspiration(inspirationQuery);

        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: data.message,
            image: galleryDesign?.src || null,
            imageName: galleryDesign?.name || null,
            inspirationPhotos,
          },
        ]);
      }
    } catch (error) {
      console.error("Chatbot request failed:", error);

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            error?.message ||
            "The chatbot could not respond right now. Please try again. 💅",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-[380px] overflow-hidden rounded-2xl shadow-2xl shadow-black/60"
          style={{
            backgroundColor: "#11100f",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          {/* HEADER */}
          <div
            className="px-5 py-4"
            style={{
              backgroundColor: "#181614",
              borderBottom:
                "1px solid rgba(255,255,255,0.09)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full"
                  style={{
                    border:
                      "1px solid rgba(214,179,106,0.5)",
                  }}
                >
                  <Image
                    src="/chatbot-icon.png"
                    alt="Freddy Nails"
                    fill
                    className="object-cover"
                  />
                </div>

                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
                    Freddy Nails
                  </p>

                  <h3 className="font-serif text-xl leading-tight text-[#f4eee6]">
                    Nail Muse
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[#c9c0b6]/70 transition-colors hover:text-[#d6b36a]"
                aria-label="Close chat"
              >
                ×
              </button>
            </div>
          </div>

          {/* MESSAGES */}
          <div
            className="h-[360px] overflow-y-auto p-4"
            style={{
              backgroundColor: "#11100f",
            }}
          >
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className="max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                    style={
                      message.role === "user"
                        ? {
                            backgroundColor: "#d6b36a",
                            color: "#11100f",
                            border:
                              "1px solid rgba(214,179,106,0.35)",
                          }
                        : {
                            backgroundColor: "#1c1a18",
                            color: "#f4eee6",
                            border:
                              "1px solid rgba(255,255,255,0.09)",
                          }
                    }
                  >
                    {message.image && (
                      <div
                        className="mb-3 overflow-hidden rounded-xl"
                        style={{
                          border:
                            "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <img
                          src={message.image}
                          alt={
                            message.imageName ||
                            "Nail inspiration"
                          }
                          className="aspect-square w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">
                      {message.content}
                    </div>

                    {message.imageName && (
                      <div
                        className="mt-3 pt-3"
                        style={{
                          borderTop:
                            "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <p className="text-xs font-bold tracking-wide text-[#d6b36a]">
                          Freddy Nails Gallery:{" "}
                          {message.imageName}
                        </p>

                        <a
                          href="#booking"
                          onClick={() => setOpen(false)}
                          className="mt-3 inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-bold transition-colors"
                          style={{
                            backgroundColor: "#d6b36a",
                            color: "#11100f",
                          }}
                        >
                          Book this look
                        </a>
                      </div>
                    )}

                    {message.inspirationPhotos?.length > 0 && (
                      <div
                        className="mt-4 pt-4"
                        style={{
                          borderTop:
                            "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#d6b36a]">
                          More inspiration
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          {message.inspirationPhotos
                            .slice(0, 4)
                            .map((photo) => (
                              <a
                                key={photo.id}
                                href={photo.pexelsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group overflow-hidden rounded-lg"
                                style={{
                                  border:
                                    "1px solid rgba(255,255,255,0.08)",
                                }}
                              >
                                <img
                                  src={photo.src}
                                  alt={photo.alt}
                                  className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              </a>
                            ))}
                        </div>

                        <p className="mt-2 text-[0.65rem] text-[#817970]">
                          Inspiration images via Pexels
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div
                    className="rounded-2xl px-4 py-3 text-sm"
                    style={{
                      backgroundColor: "#1c1a18",
                      color: "#8f877e",
                      border:
                        "1px solid rgba(255,255,255,0.09)",
                    }}
                  >
                    {pendingImage
                      ? "Looking at your photo…"
                      : "Finding something gorgeous…"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* INPUT */}
          <form
            onSubmit={sendMessage}
            className="p-3"
            style={{
              backgroundColor: "#181614",
              borderTop:
                "1px solid rgba(255,255,255,0.09)",
            }}
          >
            {pendingImage && (
              <div
                className="mb-2.5 flex items-center gap-2.5 rounded-xl p-2"
                style={{
                  backgroundColor: "#11100f",
                  border:
                    "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={pendingImage}
                    alt="Your inspiration"
                    className="h-full w-full object-cover"
                  />
                </div>

                <p className="flex-1 text-xs text-[#c9c0b6]">
                  Photo attached — I&apos;ll estimate a price
                  for this.
                </p>

                <button
                  type="button"
                  onClick={removePendingImage}
                  className="shrink-0 px-1 text-lg leading-none text-[#8f877e] transition-colors hover:text-[#d6b36a]"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            )}

            {imageError && (
              <p className="mb-2 text-xs text-red-400">
                {imageError}
              </p>
            )}

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="shrink-0 rounded-full px-3.5 py-3 text-sm transition-colors"
                style={{
                  backgroundColor: "#11100f",
                  color: "#f4eee6",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                }}
                aria-label="Upload an inspiration photo"
                title="Upload an inspiration photo"
              >
                📎
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                placeholder={
                  pendingImage
                    ? "Add a note (optional)…"
                    : "Ask for nail inspiration or paste a photo…"
                }
                className="min-w-0 flex-1 rounded-full px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: "#11100f",
                  color: "#f4eee6",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                }}
              />

              <button
                type="submit"
                disabled={loading}
                className="rounded-full px-5 py-3 text-sm font-bold transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: "#d6b36a",
                  color: "#11100f",
                }}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FLOATING CHAT BUTTON */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full"
        aria-label={
          open
            ? "Close nail assistant"
            : "Open nail assistant"
        }
      >
        {!open && (
          <>
            <span className="absolute inset-0 rounded-full bg-[#d6b36a]/40 animate-ping-slow" />
            <span className="absolute inset-0 rounded-full bg-[#d6b36a]/25 animate-ping-slower" />
          </>
        )}

        <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[#d6b36a] bg-[#11100f] shadow-xl transition-transform hover:scale-105">
          {open ? (
            <span className="text-2xl text-[#f4eee6]">
              ×
            </span>
          ) : (
            <Image
              src="/chatbot-icon.png"
              alt="Chat with Freddy Nails"
              fill
              className="object-cover"
            />
          )}
        </span>
      </button>
    </>
  );
}
