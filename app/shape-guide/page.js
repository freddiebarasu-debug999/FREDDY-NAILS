import Header from "@/components/Header";
import ShapeGuide from "@/components/ShapeGuide";
import Footer from "@/components/Footer";
import OfferTab from "@/components/OfferTab";
import ChatBot from "../ChatBot";

export default function ShapeGuidePage() {
  return (
    <>
      <OfferTab />
      <Header />

      <main className="min-h-screen bg-[#11100f] text-[#f4eee6]">
        <ShapeGuide />
      </main>

      <Footer />
      <ChatBot />
    </>
  );
}
