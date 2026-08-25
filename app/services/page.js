import Header from "@/components/Header";
import Services from "@/components/Services";
import Footer from "@/components/Footer";
import OfferTab from "@/components/OfferTab";
import ChatBot from "../ChatBot";

export default function ServicesPage() {
  return (
    <>
      <OfferTab />
      <Header />

      <main className="min-h-screen bg-[#11100f] text-[#f4eee6]">
        <Services />
      </main>

      <Footer />
      <ChatBot />
    </>
  );
}
