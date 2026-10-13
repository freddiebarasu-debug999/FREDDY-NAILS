import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ColourPalette from "@/components/ColourPalette";
import OfferTab from "@/components/OfferTab";
import ChatBot from "../ChatBot";

export const metadata = {
  title: "Gel Colours | Freddy Nails East London",
  description:
    "Browse the gel nail colours available at Freddy Nails in Quigney, East London. Nudes, pinks, shimmer and more. Pick your shade, then book your appointment.",
  alternates: { canonical: "https://freddynails.co.za/colours" },
};

export default function ColoursPage() {
  return (
    <>
      <OfferTab />
      <Header />
      <main className="mx-auto max-w-[1100px] px-5 pb-24 pt-16">
        <div className="text-center">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
            Gel colours
          </p>
          <h1 className="mt-3 font-serif text-[clamp(2rem,4.5vw,3.4rem)] text-[#f4eee6]">
            Find your shade
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] leading-relaxed text-[#c9c0b6]">
            Browse the gel colours available at Freddy Nails. Spin through the
            wheel or scroll the palette, then mention your favourites in the
            notes when you book.
          </p>
        </div>

        <div className="mt-12">
          <ColourPalette />
        </div>

        <div className="mt-14 text-center">
          <a
            href="/account/book"
            className="inline-block rounded-full bg-[#d6b36a] px-8 py-3 text-sm font-bold text-[#11100f] transition-transform hover:scale-105"
          >
            Book your set
          </a>
        </div>
      </main>
      <Footer />
      <ChatBot />
    </>
  );
}
