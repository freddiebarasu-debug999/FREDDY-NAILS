"use client";

import { useState } from "react";

const GALLERY = [
  {
    name: "Purple Chrome Ombré",
    src: "/gallery/gallery-1.jpg",
  },
  {
    name: "Black & White French",
    src: "/gallery/gallery-2.jpg",
  },
  {
    name: "Gold Outline & Pearls",
    src: "/gallery/gallery-3.jpg",
  },
  {
    name: "Floral Stiletto Art",
    src: "/gallery/gallery-4.jpg",
  },
  {
    name: "Classic Pink Square",
    src: "/gallery/gallery-5.jpg",
  },
  {
    name: "Mauve French Square",
    src: "/gallery/gallery-6.jpg",
  },
  {
    name: "Lilac Square Set",
    src: "/gallery/gallery-7.jpg",
  },
  {
    name: "Leopard French Cherry",
    src: "/gallery/gallery-8.jpg",
  },
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

  function findGalleryDesign(text) {
    const lowerText = text.toLowerCase();

    return GALLERY.find((item) =>
      lowerText.includes(item.name.toLowerCase())
    );
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

      const galleryDesign = findGalleryDesign(data.message);

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.message,
          image: galleryDesign?.src || null,
          imageName: galleryDesign?.name || null,
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
        <div className="fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-[380px] overflow-hidden rounded-2xl border border-line bg-nude shadow-2xl">
          <div className="bg-ink px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-gold">
                  Freddy Nails
                </p>

                <h3 className="mt-1 font-serif text-xl">
                  Nail Muse
                </h3>
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
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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
                          className="w-full aspect-square object-cover"
                        />
                      </div>
                    )}

                    {message.content}

                    {message.imageName && (
                      <p className="mt-3 text-xs font-bold tracking-wide text-gold">
                        Freddy Nails Gallery: {message.imageName}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-ink-soft">
                    Thinking of something gorgeous…
                  </div>
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={sendMessage}
            className="flex gap-2 border-t border-line bg-white p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for nail inspiration..."
              className="min-w-0 flex-1 rounded-full border border-line bg-nude px-4 py-3 text-sm outline-none focus:border-gold"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-ink text-2xl text-white shadow-xl transition-transform hover:scale-105"
        aria-label={open ? "Close nail assistant" : "Open nail assistant"}
      >
        {open ? "×" : "💅"}
      </button>
    </>
  );
}
