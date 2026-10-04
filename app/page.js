import Link from "next/link";
import OfferTab from "@/components/OfferTab";
import AccountPromptBanner from "@/components/AccountPromptBanner";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Gallery from "@/components/Gallery";
import Reviews from "@/components/Reviews";
import Offers from "@/components/Offers";
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

      {/* About / Services intro (SEO text) */}
      <section
        aria-labelledby="about-freddy-nails"
        className="py-8 md:py-12 px-5"
      >
        <Reveal>
          <div className="max-w-[820px] mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.2em] opacity-60">
              Quigney, East London
            </p>
            <h2
              id="about-freddy-nails"
              className="mt-3 text-3xl md:text-4xl"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              A luxury nail studio in Quigney, East London (KuGompo City)
            </h2>
            <p className="mt-5 leading-relaxed opacity-80">
              Freddy Nails is a boutique nail studio at 8 Rhodes Street in
              Quigney, East London (KuGompo City), Eastern Cape. Every set is
              personalised to you, from classic French tips to chrome, floral
              and hand-painted nail art, in a polished, relaxed studio
              experience.
            </p>
            <p className="mt-4 leading-relaxed opacity-80">
              Our services include acrylic nails, gel manicures, pedicures,
              nail art, eyelash extensions and foot spa treatments. Not sure
              what you want? Upload an inspiration photo to our nail assistant,
              Freddy&apos;s Nail Muse, for design ideas and a price estimate.
            </p>
            <p className="mt-4 leading-relaxed opacity-80">
              Appointments are by booking only. Choose your service and time
              online, or message us on WhatsApp on +27 71 088 8897.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm underline underline-offset-4">
              <Link href="/services">View services</Link>
              <Link href="/faq">Read the FAQs</Link>
              <Link href="/about">About Freddy Nails</Link>
              <Link href="/account/signup">Book your appointment</Link>
            </div>
          </div>
        </Reveal>
      </section>

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

      {/* Offers / Promotions */}
      <div className="py-4 md:py-7">
        <Reveal>
          <Offers />
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
