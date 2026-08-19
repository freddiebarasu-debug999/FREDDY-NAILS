"use client";
import { useState } from "react";

const FAQS = [
  {
    q: "Do you take walk-ins?",
    a: "We prioritise booked appointments, but message us on WhatsApp on the day — we can often fit in a walk-in between slots.",
  },
  {
    q: "What's your cancellation policy?",
    a: "We ask for at least 24 hours' notice. Late cancellations or no-shows may be asked for a deposit on future bookings.",
  },
  {
    q: "Is a deposit required?",
    a: "Standard manicures and pedicures require a R90 deposit. Extensions, parties and groups of three or more may require individual R90 deposits respectively to confirm.",
  },
  {
    q: "What are your working hours?",
    a: "We provide flexible hours for clients to choose from.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="max-w-[1180px] mx-auto px-5 py-22">
      <div className="max-w-[640px] mb-12">
        <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
          Good to know
        </p>
        <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5">
          Frequently asked
        </h2>
      </div>

      <div>
        {FAQS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q} className="border-b border-line">
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full text-left bg-transparent border-none py-5 cursor-pointer flex justify-between items-center font-semibold text-base"
              >
                {item.q}
                <span
                  className={`font-serif text-xl text-gold transition-transform ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              <div
                style={{ maxHeight: isOpen ? "200px" : "0px" }}
                className="overflow-hidden transition-all duration-300"
              >
                <p className="pb-5 text-ink-soft text-[0.92rem] leading-relaxed max-w-[70ch]">
                  {item.a}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
