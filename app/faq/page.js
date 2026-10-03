import Header from "@/components/Header";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import OfferTab from "@/components/OfferTab";
import ChatBot from "../ChatBot";

export const metadata = {
  title: "Nail Salon FAQs | Bookings, Location & Aftercare | Freddy Nails",
  description:
    "Answers to common questions about Freddy Nails in Quigney, East London (KuGompo City): booking, deposits, location, acrylic and gel nails, and aftercare.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    url: "/faq",
    title: "Nail Salon FAQs | Freddy Nails, East London",
    description:
      "Booking, location and nail care questions answered by Freddy Nails in Quigney, East London (KuGompo City).",
  },
};

export default function FAQPage() {
  return (
    <>
      <OfferTab />
      <Header />

      <main className="min-h-screen bg-[#11100f] text-[#f4eee6]">
        <FAQ />
      </main>

      <Footer />
      <ChatBot />
    </>
  );
}
