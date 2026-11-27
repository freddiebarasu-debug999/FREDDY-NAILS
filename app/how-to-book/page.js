import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatBot from "../ChatBot";

export const metadata = {
  title: "How to Book | Freddy Nails, East London",
  description:
    "A simple step-by-step guide to booking your nail appointment online at Freddy Nails in Quigney, East London (KuGompo City).",
  alternates: {
    canonical: "/how-to-book",
  },
  openGraph: {
    url: "/how-to-book",
    title: "How to Book | Freddy Nails",
    description:
      "Log in, choose your services and shape, pick a date and time, and pay your deposit. Booking takes about two minutes.",
  },
};

const STEPS = [
  {
    title: "Log in or create your free account",
    text: "Tap Book Now, then log in. New here? Tap Create account. It takes a minute, and your details are saved and filled in for next time. Account holders also get exclusive offers.",
  },
  {
    title: "Apply your offer (if you have one)",
    text: "When you are logged in, any offer for you shows in a gold card at the top of the booking page. Tap Apply. Got a code from us? Tap “Have a promo or referral code?” near the bottom and type it in.",
  },
  {
    title: "Choose who you are booking for",
    text: "Booking just for you? Leave it on “Just me”. Bringing a friend or family member? Choose that option and pick each person’s services and time. They don’t need an account.",
  },
  {
    title: "Choose your services",
    text: "Tap “Choose a service” and pick your set. Want more than one thing, like a set and a pedicure? Tap “Add another service”.",
  },
  {
    title: "Pick your nail shape",
    text: "For nail sets, choose your shape: Almond, Square, Squoval, Oval, Coffin or Stiletto. Not sure? Add a note and Freddy will guide you.",
  },
  {
    title: "Choose your date and time",
    text: "After you choose a service, the available dates and times appear. Tap the date you want, then tap a time. Only open slots are shown.",
  },
  {
    title: "Add notes (optional)",
    text: "Share inspiration or special requests here. Please choose all your services above instead of listing them in the notes.",
  },
  {
    title: "Pay your deposit to lock in your slot",
    text: "Tap Pay Deposit. You are taken to Yoco to pay securely. The standard deposit is R90 per client. Your slot is held for 30 minutes while you pay, so you have time to check your funds. Once paid, your booking is confirmed.",
  },
];

const HELP = [
  {
    q: "I can’t see any times.",
    a: "Choose a service first. Times appear once a service is selected. If a day has no slots, try another day.",
  },
  {
    q: "It says my time is no longer available.",
    a: "Someone may have booked it, or your payment took too long. Choose a time again. It only takes a moment.",
  },
  {
    q: "I paid but didn’t get a confirmation.",
    a: "Open My Account to see your upcoming appointments. Still not sure? WhatsApp us and we will check.",
  },
  {
    q: "What do I pay on the day?",
    a: "The deposit secures your slot. The final service price is confirmed at your appointment with Freddy Nails.",
  },
];

export default function HowToBookPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#11100f] text-[#f4eee6]">
        <div className="max-w-[860px] mx-auto px-5 pt-32 pb-20">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#d6b36a]">
            Booking guide
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl mt-3 leading-tight">
            How to book your appointment
          </h1>
          <p className="text-[#c9c0b6] mt-5 text-lg leading-relaxed">
            Booking with Freddy Nails takes about two minutes. Follow these
            steps and you will be all set.
          </p>

          <a
            href="/account/book"
            className="inline-block mt-8 bg-[#d6b36a] text-[#11100f] px-8 py-4 text-sm font-bold uppercase tracking-wide hover:bg-[#e4c47e] transition-colors"
          >
            Book now
          </a>

          <ol className="mt-14 space-y-5">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 border border-white/[0.09] bg-[#181614] p-5"
              >
                <span className="shrink-0 w-10 h-10 rounded-full border border-[#d6b36a] text-[#d6b36a] flex items-center justify-center font-serif text-lg">
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-serif text-xl text-[#f4eee6]">
                    {step.title}
                  </h2>
                  <p className="text-[#c9c0b6] mt-2 leading-relaxed">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <section className="mt-16">
            <h2 className="font-serif text-3xl">Stuck? Quick answers</h2>
            <div className="mt-6 space-y-4">
              {HELP.map((item) => (
                <div
                  key={item.q}
                  className="border-l-2 border-[#d6b36a] pl-4"
                >
                  <h3 className="font-bold text-[#f4eee6]">{item.q}</h3>
                  <p className="text-[#c9c0b6] mt-1 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-16 border border-[#d6b36a]/30 bg-[#d6b36a]/10 p-6">
            <h2 className="font-serif text-2xl">Prefer to book on WhatsApp?</h2>
            <p className="text-[#c9c0b6] mt-2">
              Message us and we will help you book.
            </p>
            <a
              href="https://wa.me/27710888897"
              className="inline-block mt-4 border border-[#d6b36a] text-[#d6b36a] px-6 py-3 text-sm font-bold uppercase tracking-wide hover:bg-[#d6b36a] hover:text-[#11100f] transition-colors"
            >
              WhatsApp 071 088 8897
            </a>
          </section>
        </div>
      </main>

      <Footer />
      <ChatBot />
    </>
  );
}
