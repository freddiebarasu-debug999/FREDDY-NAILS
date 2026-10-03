import Header from "@/components/Header";
import Services from "@/components/Services";
import Footer from "@/components/Footer";
import OfferTab from "@/components/OfferTab";
import ChatBot from "../ChatBot";

export const metadata = {
  title:
    "Nail Services in East London (KuGompo City) | Acrylic, Gel, Pedicures | Freddy Nails",
  description:
    "Acrylic nails, gel manicures, pedicures, nail art, eyelash extensions and foot spa at Freddy Nails in Quigney, East London (KuGompo City). Book online.",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    url: "/services",
    title: "Nail Services in East London | Freddy Nails",
    description:
      "Acrylic and gel nails, pedicures, nail art, lash extensions and foot spa in Quigney, East London (KuGompo City).",
  },
};

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
