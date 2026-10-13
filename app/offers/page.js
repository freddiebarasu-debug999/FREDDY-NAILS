import Header from "@/components/Header";
import Offers from "@/components/Offers";
import Footer from "@/components/Footer";
import OfferTab from "@/components/OfferTab";
import ChatBot from "../ChatBot";

export const metadata = {
  title: "Nail Offers & Promo Codes | Freddy Nails, East London",
  description:
    "Save on your next appointment at Freddy Nails in Quigney, East London (KuGompo City): first visit discount, bring-a-friend and birthday offers.",
  alternates: {
    canonical: "/offers",
  },
  openGraph: {
    url: "/offers",
    title: "Nail Offers & Promo Codes | Freddy Nails",
    description:
      "First visit, bring-a-friend and birthday offers at Freddy Nails in Quigney, East London (KuGompo City).",
  },
};

export default function OffersPage() {
  return (
    <>
      <OfferTab />
      <Header />

      <main className="min-h-screen bg-[#11100f] text-[#f4eee6]">
        <Offers />
      </main>

      <Footer />
      <ChatBot />
    </>
  );
}
