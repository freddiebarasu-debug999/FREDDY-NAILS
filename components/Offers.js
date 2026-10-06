"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

// The chosen offer is remembered in the browser for 24 hours so it
// survives logging in. The booking page picks it up and applies it.
const CHOSEN_PROMO_KEY = "freddynails_chosen_promo";

const OFFERS = [
  {
    title: "First Visit",
    code: "FIRSTVISIT",
    discount: "15% OFF",
    description:
      "New to Freddy Nails? Enjoy 15% off your first visit.",
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {OFFERS.map((offer) => {
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
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-7 text-left transition duration-300 hover:-translate-y-1 hover:border-yellow-500/50 hover:bg-black/50"
              >
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-yellow-500/10 blur-2xl transition group-hover:bg-yellow-500/20" />

                <p className="relative mb-3 text-xs uppercase tracking-[0.25em] text-yellow-500">
                  {offer.title}
                </p>

                <h3 className="relative text-2xl font-semibold">
                  {offer.discount}
                </h3>

                <p className="relative mt-4 text-sm leading-6 opacity-70">
                  {offer.description}
                </p>

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
