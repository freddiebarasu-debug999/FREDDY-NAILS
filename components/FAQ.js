"use client";
import { useState } from "react";

const FAQS = [
  {
    q: "Where is Freddy Nails located?",
    a: "Freddy Nails is at 8 Rhodes Street, Quigney, East London (KuGompo City), Eastern Cape. We work by appointment, so please book online or message us on WhatsApp on +27 71 088 8897.",
  },
  {
    q: "Where can I get acrylic nails in East London?",
    a: "Freddy Nails in Quigney, East London (KuGompo City) offers acrylic nails in a range of shapes, lengths and designs, from classic French tips to full nail art. Book your appointment online to secure your slot.",
  },
  {
    q: "How much are gel nails?",
    a: "Gel manicures at Freddy Nails start at R200 for a gel overlay. Plain gel is R250 (short to medium) or R300 (long), and French gel is R300 (short to medium) or R350 (long). Nail art is extra. See the full menu on our Services page, or upload an inspiration photo to Freddy's Nail Muse chatbot for a price estimate.",
  },
  {
    q: "What nail services do you offer?",
    a: "We offer acrylic nails, gel manicures, pedicures, nail art, eyelash extensions and foot spa treatments at our studio in Quigney, East London.",
  },
  {
    q: "How do I book an appointment?",
    a: "Choose your service and a time that suits you on our booking page, or message us on WhatsApp on +27 71 088 8897 and we will help you book.",
  },
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

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="max-w-[1180px] mx-auto px-5 py-22">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
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
                style={{ maxHeight: isOpen ? "400px" : "0px" }}
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
