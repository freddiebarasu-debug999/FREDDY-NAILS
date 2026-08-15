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

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      <About />
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      <Services />
      <ShapeGuide />
      <Gallery />
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      <Booking />
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      <Offers />
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      <Reviews />
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      <FAQ />
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      <Contact />
      <Footer />
    </>
  );
}
