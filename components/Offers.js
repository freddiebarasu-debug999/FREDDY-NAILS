"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// The chosen offer is remembered in the browser for 24 hours so it
// survives logging in. The booking page picks it up and applies it.
const CHOSEN_PROMO_KEY = "freddynails_chosen_promo";

const OFFERS = [
  // Black Friday 2026: shows automatically 24-30 Nov (South African time),
  // then disappears by itself. Nothing to switch off.
  {
    title: "Black Friday Glow Deal",
    code: "BLACKFRIDAY40",
    discount: "40% OFF",
    description:
      "Exclusive to Freddy Nails account holders. Log in to claim your 40% off nail sets.",
    note: "Nail sets only (Acrylic & Gel). Not soak offs or other services. Valid 24–30 Nov 2026.",
    badge: "Account holders",
    featured: true,
    startsAt: "2026-11-24T00:00:00+02:00",
    endsAt: "2026-12-01T00:00:00+02:00",
  },
  {
    title: "Black Friday Glow Deal",
    code: "BLACKFRIDAY30",
    discount: "30% OFF",
    description:
      "30% off nail sets for all clients. Create a free account to unlock 40% off.",
    note: "Nail sets only (Acrylic & Gel). Not soak offs or other services. Valid 24–30 Nov 2026.",
    badge: "Everyone",
    featured: true,
    startsAt: "2026-11-24T00:00:00+02:00",
    endsAt: "2026-12-01T00:00:00+02:00",
  },
  {
    title: "Book Online",
    code: "WELCOME10",
    discount: "10% OFF",
    description:
      "Book through our website and enjoy 10% off your appointment.",
  },
  {
    title: "Bring a Friend",
    code: "FRIEND50",
    discount: "R50 OFF",
    description:
      "Bring a friend along and enjoy R50 off your service.",
  },
  {
    title: "Birthday",
    code: "BIRTHDAY",
    discount: "R50 OFF",
    description:
      "Celebrate your birthday with Freddy Nails and receive R50 off.",
  },
];

export default function Offers() {
  const [copiedCode, setCopiedCode] =
    useState("");

  // Offers with a date window only show while they are running. Worked out
  // in the browser after the page loads so it is always right.
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const visibleOffers = OFFERS.filter((offer) => {
    if (!offer.startsAt && !offer.endsAt) return true;
    if (now === null) return false;
    if (offer.startsAt && now < new Date(offer.startsAt).getTime()) return false;
    if (offer.endsAt && now >= new Date(offer.endsAt).getTime()) return false;
    return true;
  });

  async function chooseOffer(code) {
    // Copy the code as a backup in case the client needs to paste it.
    try {
      navigator.clipboard.writeText(code);
    } catch {
      // Clipboard may be unavailable.
    }

    // Remember the chosen offer. It only applies because the client
    // tapped it, and only for the next 24 hours.
    try {
      window.localStorage.setItem(
        CHOSEN_PROMO_KEY,
        JSON.stringify({ code, savedAt: Date.now() })
      );
    } catch {
      // Storage may be unavailable.
    }

    setCopiedCode(code);

    // Logged-in clients go straight to booking. Everyone else goes to
    // the account portal, which sends them to log in.
    let loggedIn = false;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      loggedIn = Boolean(session?.user);
    } catch {
      loggedIn = false;
    }

    window.setTimeout(() => {
      window.location.href = loggedIn ? "/account/book" : "/account";
    }, 600);
  }

  return (
    <section
      id="offers"
      className="w-full py-20"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-yellow-500">
            Ways to Save
          </p>

          <h2 className="text-3xl font-semibold md:text-5xl">
            Exclusive Offers
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 opacity-70 md:text-base">
            Treat yourself while saving on your
            next Freddy Nails appointment.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleOffers.map((offer) => {
            const isCopied =
              copiedCode ===
              offer.code;

            return (
              <button
                key={offer.code}
                type="button"
                onClick={() =>
                  chooseOffer(
                    offer.code
                  )
                }
                className={`group relative overflow-hidden rounded-3xl border p-7 text-left transition duration-300 hover:-translate-y-1 hover:border-yellow-500/50 hover:bg-black/50 ${
                  offer.featured
                    ? "border-yellow-500/40 bg-yellow-500/[0.07]"
                    : "border-white/10 bg-black/30"
                }`}
              >
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-yellow-500/10 blur-2xl transition group-hover:bg-yellow-500/20" />

                <p className="relative mb-3 text-xs uppercase tracking-[0.25em] text-yellow-500">
                  {offer.title}
                  {offer.badge ? (
                    <span className="ml-2 rounded-full border border-yellow-500/40 px-2 py-0.5 text-[10px] tracking-widest">
                      {offer.badge}
                    </span>
                  ) : null}
                </p>

                <h3 className="relative text-2xl font-semibold">
                  {offer.discount}
                </h3>

                <p className="relative mt-4 text-sm leading-6 opacity-70">
                  {offer.description}
                </p>

                {offer.note ? (
                  <p className="relative mt-3 text-xs leading-5 text-yellow-500/90">
                    {offer.note}
                  </p>
                ) : null}

                <div className="relative mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest opacity-50">
                        Promo code
                      </p>

                      <p className="mt-1 font-mono text-sm font-semibold tracking-wider text-yellow-500">
                        {offer.code}
                      </p>
                    </div>

                    <span className="rounded-full border border-yellow-500/30 px-3 py-1 text-xs">
                      {isCopied
                        ? "Saved ✓"
                        : "Use offer"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {copiedCode && (
          <p className="mt-6 text-center text-sm text-yellow-500">
            Offer saved. Taking you to your account — it will apply
            automatically when you book.
          </p>
        )}

        <p className="mt-8 text-center text-xs opacity-50">
          Promo discounts apply to eligible services.
          Only one promo code can be used per booking.
          The booking deposit remains R90 per client.
        </p>
      </div>
    </section>
  );
}
