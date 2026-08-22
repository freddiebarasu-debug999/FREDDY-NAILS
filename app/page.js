import OfferTab from "@/components/OfferTab";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import ShapeGuide from "@/components/ShapeGuide";
import Gallery from "@/components/Gallery";
import Booking from "@/components/Booking";
import Offers from "@/components/Offers";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";
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
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      {/* Gallery */}
      <div className="py-10 md:py-16">
        <Reveal>
          <Gallery />
        </Reveal>
      </div>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      {/* Services & Pricing */}
      <div className="py-10 md:py-16">
        <Reveal>
          <Services />
        </Reveal>
      </div>
      <div className="py-10 md:py-16">
        <Reveal delay={100}>
          <ShapeGuide />
        </Reveal>
      </div>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      {/* Booking */}
      <div className="py-10 md:py-16">
        <Reveal>
          <Booking />
        </Reveal>
      </div>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      {/* Offers */}
      <div className="py-10 md:py-16">
        <Reveal>
          <Offers />
        </Reveal>
      </div>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      {/* Reviews */}
      <div className="py-10 md:py-16">
        <Reveal>
          <Reviews />
        </Reveal>
      </div>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      {/* FAQ */}
      <div className="py-10 md:py-16">
        <Reveal>
          <FAQ />
        </Reveal>
      </div>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      {/* About the Studio */}
      <div className="py-10 md:py-16">
        <Reveal>
          <About />
        </Reveal>
      </div>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      {/* Contact */}
      <div className="py-10 md:py-16">
        <Reveal>
          <Contact />
        </Reveal>
      </div>
      <Footer />
      <ChatBot />
    </>
  );
}
