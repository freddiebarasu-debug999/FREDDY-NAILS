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
      <Reveal>
        <About />
      </Reveal>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      <Reveal>
        <Services />
      </Reveal>
      <Reveal delay={100}>
        <ShapeGuide />
      </Reveal>
      <Reveal>
        <Gallery />
      </Reveal>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      <Reveal>
        <Booking />
      </Reveal>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      <Reveal>
        <Offers />
      </Reveal>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      <Reveal>
        <Reviews />
      </Reveal>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      <Reveal>
        <FAQ />
      </Reveal>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      <Reveal>
        <Contact />
      </Reveal>
      <Footer />
      <ChatBot />
    </>
  );
}
