import OfferTab from "@/components/OfferTab";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import ShapeGuide from "@/components/ShapeGuide";
import Gallery from "@/components/Gallery";
import Offers from "@/components/Offers";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ChatBot from "./ChatBot";
import Reveal from "@/components/Reveal";
import WelcomePopup from "@/components/WelcomePopup";
function ClientAccountPrompt() {
  return (
    <section className="mx-auto max-w-[1180px] px-5 py-8 md:py-10">
      <div className="border border-[#d6b36a]/25 bg-[#181614] px-6 py-8 text-center md:px-12 md:py-10">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
          Freddy Nails Client Portal
        </p>
        <h2 className="mx-auto mt-3 max-w-[700px] font-serif text-3xl text-[#f4eee6] md:text-4xl">
          Ready to book your next set?
        </h2>
        <p className="mx-auto mt-4 max-w-[650px] text-sm leading-relaxed text-[#a79a87]">
          All Freddy Nails appointments are booked through your
          personal client account. Create an account to book, manage
          your appointments, view your booking history and access
          exclusive specials and promo codes.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="/account/signup"
            className="inline-flex items-center justify-center bg-[#d6b36a] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[#11100f] transition-colors hover:bg-[#ad8a4e]"
          >
            Create Your Account →
          </a>
          <a
            href="/account/login"
            className="inline-flex items-center justify-center border border-white/[0.12] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[#c9c0b6] transition-colors hover:border-[#d6b36a]/40 hover:text-[#d6b36a]"
          >
            Already Have an Account? Log In
          </a>
        </div>
        <p className="mt-4 text-xs text-[#817970]">
          New client? Creating your account takes just a moment.
        </p>
      </div>
    </section>
  );
}
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
      <div
        id="gallery"
        className="py-7 md:py-10 scroll-mt-24"
      >
        <Reveal>
          <Gallery />
        </Reveal>
      </div>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      {/* Services & Pricing */}
      <div
        id="services"
        className="py-7 md:py-10 scroll-mt-24"
      >
        <Reveal>
          <Services />
        </Reveal>
      </div>
      {/* Shape Guide */}
      <div className="py-7 md:py-10">
        <Reveal delay={100}>
          <ShapeGuide />
        </Reveal>
      </div>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      {/* Client booking / account prompt */}
      <div
        id="booking"
        className="scroll-mt-24"
      >
        <Reveal>
          <ClientAccountPrompt />
        </Reveal>
      </div>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      {/* Offers / Ways to Save */}
      <div
        id="offers"
        className="py-7 md:py-10 scroll-mt-24"
      >
        <Reveal>
          <Offers />
        </Reveal>
      </div>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      {/* Reviews / What Our Clients Say */}
      <div
        id="reviews"
        className="py-7 md:py-10 scroll-mt-24"
      >
        <Reveal>
          <Reviews />
        </Reveal>
      </div>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      {/* FAQ */}
      <div className="py-7 md:py-10">
        <Reveal>
          <FAQ />
        </Reveal>
      </div>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      {/* About the Studio */}
      <div
        id="about"
        className="py-7 md:py-10 scroll-mt-24"
      >
        <Reveal>
          <About />
        </Reveal>
      </div>
      <div className="h-px max-w-[1180px] mx-auto bg-line" />
      {/* Contact */}
      <div
        id="contact"
        className="py-7 md:py-10 scroll-mt-24"
      >
        <Reveal>
          <Contact />
        </Reveal>
      </div>
      <Footer />
      <ChatBot />
    </>
  );
}
