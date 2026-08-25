import Header from "@/components/Header";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import OfferTab from "@/components/OfferTab";
import ChatBot from "../ChatBot";

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
