"use client";

import { useState } from "react";
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

export default function ChatBot() {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! 💅 I'm Freddy's Nail Muse. Tell me what kind of nails you're thinking about, and I'll help you find a style.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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

    if (newDesign) return newDesign;

    return matchingDesigns[0] || null;
  }

  async function searchInspiration(query) {
    try {
      const response = await fetch(
        `/api/inspiration?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) return [];

      const data = await response.json();

      return data.photos || [];
    } catch (error) {
      console.error("Inspiration search error:", error);
      return [];
    }
  }

  async function sendMessage(e) {
    e.preventDefault();

    const text = input.trim();

    if (!text || loading) return;

    const newMessages = [
      ...messages,
      {
        role: "user",
        content: text,
      },
    ];

    setMessages(newMessages);
    setInput("");
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

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
        <div className="fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-[380px] overflow-hidden rounded-2xl border border-white/[0.10] bg-[#11100f] shadow-2xl shadow-black/50">
          {/* CHAT HEADER */}
          <div className="border-b border-white/[0.09] bg-[#181614] px-5 py-4 text-[#f4eee6]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#d6b36a]/50">
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

          {/* CHAT MESSAGES */}
          <div className="h-[360px] overflow-y-auto bg-[#11100f] p-4">
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
                    className={`max-w-[90%] rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "border-[#d6b36a]/20 bg-[#d6b36a] text-[#11100f]"
                        : "border-white/[0.09] bg-[#1c1a18] text-[#f4eee6]"
                    }`}
                  >
                    {message.image && (
                      <div className="mb-3 overflow-hidden rounded-xl border border-white/[0.08]">
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
                      <div className="mt-3 border-t border-white/[0.08] pt-3">
                        <p className="text-xs font-bold tracking-wide text-[#d6b36a]">
                          Freddy Nails Gallery: {message.imageName}
                        </p>

                        <a
                          href="#booking"
                          onClick={() => setOpen(false)}
                          className="mt-3 inline-flex items-center justify-center rounded-full bg-[#d6b36a] px-4 py-2 text-xs font-bold text-[#11100f] transition-colors hover:bg-[#ad8a4e]"
                        >
                          Book this look
                        </a>
                      </div>
                    )}

                    {message.inspirationPhotos?.length > 0 && (
                      <div className="mt-4 border-t border-white/[0.08] pt-4">
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
                                className="group overflow-hidden rounded-lg border border-white/[0.08]"
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
                  <div className="rounded-2xl border border-white/[0.09] bg-[#1c1a18] px-4 py-3 text-sm text-[#8f877e]">
                    Finding something gorgeous…
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CHAT INPUT */}
          <form
            onSubmit={sendMessage}
            className="flex gap-2 border-t border-white/[0.09] bg-[#181614] p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for nail inspiration..."
              className="min-w-0 flex-1 rounded-full border border-white/[0.12] bg-[#11100f] px-4 py-3 text-sm text-[#f4eee6] outline-none placeholder:text-[#817970] focus:border-[#d6b36a]"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#d6b36a] px-5 py-3 text-sm font-bold text-[#11100f] transition-colors hover:bg-[#ad8a4e] disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* FLOATING CHAT BUTTON */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full"
        aria-label={
          open ? "Close nail assistant" : "Open nail assistant"
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
            <span className="text-2xl text-[#f4eee6]">×</span>
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
