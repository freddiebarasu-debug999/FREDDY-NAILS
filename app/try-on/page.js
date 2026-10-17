import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OfferTab from "@/components/OfferTab";
import ChatBot from "../ChatBot";
import TryOn from "@/components/TryOn";

export const metadata = {
  title: "Try Nail Designs On Your Hand | Freddy Nails East London",
  description:
    "See how a nail shape, finish and colour could look on your own hand before you book. Free virtual nail try-on from Freddy Nails in Quigney, East London.",
  alternates: { canonical: "https://freddynails.co.za/try-on" },
};

export default function TryOnPage() {
  return (
    <>
      <OfferTab />
      <Header />
      <main className="mx-auto max-w-[760px] px-5 pb-24 pt-16">
        <div className="text-center">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
            Virtual try-on
          </p>
          <h1 className="mt-3 font-serif text-[clamp(2rem,5vw,3.2rem)] text-[#f4eee6]">
            See it on <span className="italic text-[#d6b36a]">your hands</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[48ch] leading-relaxed text-[#c9c0b6]">
            Add a photo of your hand, pick a shape, finish and colour, or upload a design you love,
            and see how it could look before you book.
          </p>
        </div>

        <div className="mt-10">
          <TryOn />
        </div>
      </main>
      <Footer />
      <ChatBot />
    </>
  );
}
