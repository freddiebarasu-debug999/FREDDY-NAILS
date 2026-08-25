import Header from "@/components/Header";
import About from "@/components/About";
import Footer from "@/components/Footer";
import OfferTab from "@/components/OfferTab";
import ChatBot from "../ChatBot";

export default function AboutPage() {
  return (
    <>
      <OfferTab />
      <Header />

      <main className="min-h-screen bg-[#11100f] text-[#f4eee6]">
        <About />
      </main>

      <Footer />
      <ChatBot />
    </>
  );
}
