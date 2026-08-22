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

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

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
      reader.onerror = () => reject(new Error("Could not read the image."));
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
      setImageError("That image is a bit large — please use one under 5MB.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPendingImage(dataUrl);
    } catch (err) {
      console.error("Image read error:", err);
      setImageError("Couldn't load that image. Please try another.");
    }
  }

  function handleFileInputChange(e) {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
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

    if ((!text && !pendingImage) || loading) return;

    const imageToSend = pendingImage;

    const newMessages = [
      ...messages,
      {
        role: "user",
        content:
          text || (imageToSend ? "Here's a photo of what I have in mind." : ""),
        image: imageToSend || null,
      },
    ];

    setMessages(newMessages);
    setInput("");
    setPendingImage(null);
    setLoading(true);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Skip gallery-matching and Pexels inspiration search when the
      // visitor supplied their own photo — the reply already
      // addresses their exact image.
      if (imageToSend) {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: data.message,
          },
        ]);
      } else {
        const galleryDesign = findGalleryDesign(data.message, messages);

        const inspirationQuery = `${data.message
          .replace(/[#*_]/g, "")
          .slice(0, 180)} nail design manicure`;

        const inspirationPhotos = await searchInspiration(inspirationQuery);

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
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "Sorry, I'm having a little trouble right now. Please try again in a moment. 💅",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-[380px] overflow-hidden rounded-2xl border border-line bg-nude shadow-2xl">
          <div className="bg-ink px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gold/50">
                  <Image
                    src="/chatbot-icon.png"
                    alt="Freddy Nails"
                    fill
                    className="object-cover"
                  />
                </div>

                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-gold">
                    Freddy Nails
                  </p>

                  <h3 className="font-serif text-xl leading-tight">
                    Nail Muse
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white"
                aria-label="Close chat"
              >
                ×
              </button>
            </div>
          </div>

          <div className="h-[360px] overflow-y-auto p-4">
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
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-ink text-white"
                        : "bg-white text-ink"
                    }`}
                  >
                    {message.image && (
                      <div className="mb-3 overflow-hidden rounded-xl">
                        <img
                          src={message.image}
                          alt={message.imageName || "Nail inspiration"}
                          className="aspect-square w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">
                      {message.content}
                    </div>

                    {message.imageName && (
                      <div className="mt-3">
                        <p className="text-xs font-bold tracking-wide text-gold">
                          Freddy Nails Gallery: {message.imageName}
                        </p>

                        <a
                          href="#booking"
                          onClick={() => setOpen(false)}
                          className="mt-3 inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-80"
                        >
                          Book this look
                        </a>
                      </div>
                    )}

                    {message.inspirationPhotos?.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-gold">
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
                              >
                                <img
                                  src={photo.src}
                                  alt={photo.alt}
                                  className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              </a>
                            ))}
                        </div>

                        <p className="mt-2 text-[0.65rem] text-ink-soft">
                          Inspiration images via Pexels
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-ink-soft">
                    {pendingImage
                      ? "Looking at your photo…"
                      : "Finding something gorgeous…"}
                  </div>
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={sendMessage}
            className="border-t border-line bg-white p-3"
          >
            {pendingImage && (
              <div className="mb-2.5 flex items-center gap-2.5 rounded-xl border border-line bg-nude p-2">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={pendingImage}
                    alt="Your inspiration"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="flex-1 text-xs text-ink-soft">
                  Photo attached — I&apos;ll estimate a price for this.
                </p>
                <button
                  type="button"
                  onClick={removePendingImage}
                  className="shrink-0 text-ink-soft hover:text-ink text-lg leading-none px-1"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            )}

            {imageError && (
              <p className="mb-2 text-xs text-red-600">{imageError}</p>
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
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 rounded-full border border-line bg-nude px-3.5 py-3 text-sm hover:border-gold transition-colors"
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
                className="min-w-0 flex-1 rounded-full border border-line bg-nude px-4 py-3 text-sm outline-none focus:border-gold"
              />

              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full"
        aria-label={open ? "Close nail assistant" : "Open nail assistant"}
      >
        {!open && (
          <>
            <span className="absolute inset-0 rounded-full bg-gold/40 animate-ping-slow" />
            <span className="absolute inset-0 rounded-full bg-gold/25 animate-ping-slower" />
          </>
        )}

        <span className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold bg-ink shadow-xl transition-transform hover:scale-105 overflow-hidden">
          {open ? (
            <span className="text-2xl text-white">×</span>
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
