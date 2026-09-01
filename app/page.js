import OfferTab from "@/components/OfferTab";
import AccountPromptBanner from "@/components/AccountPromptBanner";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Gallery from "@/components/Gallery";
import Reviews from "@/components/Reviews";
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

      {/* Hero */}
      <Hero />

      <div className="h-px max-w-[1180px] mx-auto bg-line" />

      {/* Gallery */}
      <div className="py-4 md:py-7">
        <Reveal>
          <Gallery />
        </Reveal>
      </div>

      <div className="h-px max-w-[1180px] mx-auto bg-line" />

      {/* Reviews */}
      <div className="py-4 md:py-7">
        <Reveal>
          <Reviews />
        </Reveal>
      </div>

      <div className="h-px max-w-[1180px] mx-auto bg-line" />

      {/* Contact / Location */}
      <div className="py-4 md:py-7">
        <Reveal>
          <Contact />
        </Reveal>
      </div>

      <Footer />

      <ChatBot />
    </>
  );
}
