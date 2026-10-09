"use client";

const REVIEW_URL = "https://g.page/r/CcR1DUgY4s7NEBM/review";

export default function ReviewReward() {
  return (
    <section
      aria-labelledby="review-title"
      className="group relative mt-9 overflow-hidden rounded-[20px] border border-[#d6b36a]/40 bg-gradient-to-br from-[#d6b36a]/20 via-[#ad8a4e]/10 to-transparent p-6 text-center md:p-8"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
      />

      <div className="relative">
        <div className="flex justify-center gap-1 text-2xl text-[#d6b36a]" aria-hidden="true">
          {[0, 1, 2, 3, 4].map(function (i) {
            return (
              <span
                key={i}
                className="inline-block transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-125"
                style={{ transitionDelay: i * 60 + "ms" }}
              >
                ★
              </span>
            );
          })}
        </div>

        <h2 id="review-title" className="mt-3 font-serif text-2xl text-[#f4eee6]">
          Review and reward 🎁
        </h2>
        <p className="mx-auto mt-2 max-w-[44ch] text-sm leading-relaxed text-[#c9c0b6]">
          We&apos;d love to hear about your Freddy Nails Studio experience. Leave a
          review on Google and stand a chance to receive a discount on your next
          visit.
        </p>

        <a
          href={REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-block rounded-full bg-[#d6b36a] px-7 py-3 text-sm font-bold text-[#11100f] transition-all duration-200 hover:scale-105 hover:bg-[#f0d58f] active:scale-95"
        >
          Leave a Google review
        </a>
      </div>
    </section>
  );
}
