import Link from "next/link";
import OfferTab from "@/components/OfferTab";
import AccountPromptBanner from "@/components/AccountPromptBanner";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HomeServices from "@/components/HomeServices";
import TryOnPromo from "@/components/TryOnPromo";
import Gallery from "@/components/Gallery";
import Reviews from "@/components/Reviews";
import HomePromoRow from "@/components/HomePromoRow";
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

      <TryOnPromo />

      {/* Gallery */}
      <div className="bg-[#f4eee6] text-[#11100f]">
        <div className="max-w-[1180px] mx-auto px-5 pt-4 pb-2 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.4rem)]">
              Our Gallery
            </h2>
            <p className="mt-1 text-sm text-[#5c534c]">
              Real nails. Real people. Real art.
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

      <HomePromoRow />

      <div className="bg-[#11100f] text-[#f4eee6]">
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
