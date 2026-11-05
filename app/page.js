import Link from "next/link";
import OfferTab from "@/components/OfferTab";
import AccountPromptBanner from "@/components/AccountPromptBanner";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HomeServices from "@/components/HomeServices";
import Gallery from "@/components/Gallery";
import Reviews from "@/components/Reviews";
import ShapeGuide from "@/components/ShapeGuide";
import ColourPalette from "@/components/ColourPalette";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ChatBot from "./ChatBot";
import Reveal from "@/components/Reveal";
import WelcomePopup from "@/components/WelcomePopup";

export default function Home() {
  return (
    <>
      <WelcomePopup />
      <OfferTab />
      <Header />

      <Hero />

      <HomeServices />

      {/* About strip */}
      <section
        aria-labelledby="about-freddy-nails"
        className="px-5 py-12 md:py-16"
      >
        <Reveal>
          <div className="mx-auto max-w-[820px] text-center">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
              Quigney, East London
            </p>
            <h2
              id="about-freddy-nails"
              className="mt-3 font-serif text-[clamp(1.8rem,4vw,2.5rem)] text-[#f4eee6]"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              A personal nail studio,{" "}
              <span className="italic text-[#d6b36a]">crafted to perfection</span>
            </h2>
            <p className="mt-5 leading-relaxed text-[#c9c0b6]">
              Freddy Nails is a boutique studio at 8 Rhodes Street, Quigney.
              Every set is personalised — from classic French to chrome, floral
              and hand-painted art — in a polished, relaxed space.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#d6b36a]">
              <Link href="/services" className="underline-offset-4 hover:underline">
                Services
              </Link>
              <Link href="/offers" className="underline-offset-4 hover:underline">
                Specials
              </Link>
              <Link href="/shape-guide" className="underline-offset-4 hover:underline">
                Shape guide
              </Link>
              <Link href="/account/book" className="underline-offset-4 hover:underline">
                Book
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <div className="mx-auto h-px max-w-[1180px] bg-[#d6b36a]/15" />

      <div className="py-6 md:py-10">
        <Reveal>
          <ShapeGuide />
        </Reveal>
      </div>

      <div className="mx-auto h-px max-w-[1180px] bg-[#d6b36a]/15" />

      <div className="py-6 md:py-10">
        <Reveal>
          <ColourPalette />
        </Reveal>
      </div>

      <div className="mx-auto h-px max-w-[1180px] bg-[#d6b36a]/15" />

      <div className="bg-[#f4eee6] py-4 text-[#11100f] md:py-8">
        <div className="mx-auto flex max-w-[1180px] items-end justify-between px-5 pb-2">
          <div>
            <h2
              className="font-serif text-[clamp(1.8rem,3.5vw,2.4rem)]"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              Portfolio
            </h2>
            <p className="mt-1 text-sm text-[#5c534c]">
              Real nails. Real clients. Real art.
            </p>
          </div>
          <Link
            href="/#gallery"
            className="text-sm font-semibold text-[#8a6a35] hover:underline underline-offset-4"
          >
            View more →
          </Link>
        </div>
        <Reveal>
          <Gallery />
        </Reveal>
      </div>

      <div className="bg-[#f4eee6]">
        <Reveal>
          <Reviews />
        </Reveal>
      </div>

      <div className="bg-[#0c0b0a] text-[#f4eee6]">
        <Reveal>
          <Contact />
        </Reveal>
      </div>

      <AccountPromptBanner />
      <Footer />
      <ChatBot />
    </>
  );
}
