import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WaitlistForm from "./WaitlistForm";

export const metadata = {
  title: "Join the Waitlist | Freddy Nails",
  description: "Fully booked? Join the Freddy Nails waitlist and we'll email you the moment a slot opens.",
  robots: { index: false, follow: true },
};

export default function WaitlistPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#11100f] text-[#f4eee6]">
        <div className="mx-auto max-w-xl px-4 py-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d6b36a]">Freddy Nails</p>
          <h1 className="mt-2 font-serif text-4xl">Join the waitlist</h1>
          <p className="mt-3 text-[#c9c0b6]">
            Fully booked for the day you wanted? Leave your details and we&apos;ll email you the moment a slot opens up.
          </p>
          <WaitlistForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
