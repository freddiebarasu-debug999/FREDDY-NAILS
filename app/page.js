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
    <section className="mx-auto max-w-[1180px] px-5 py-10 md:py-14">
      <div className="border border-[#d6b36a]/25 bg-[#181614] px-6 py-9 text-center md:px-12 md:py-12">
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

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
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

        <p className="mt-5 text-xs text-[#817970]">
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

      {/* Hero — kept exactly as requested */}
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

      {/* Client booking / account prompt */}
      <Reveal>
        <ClientAccountPrompt />
      </Reveal>

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
