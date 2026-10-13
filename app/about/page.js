import Header from "@/components/Header";
import About from "@/components/About";
import Footer from "@/components/Footer";
import OfferTab from "@/components/OfferTab";
import ChatBot from "../ChatBot";

export const metadata = {
  title: "About Freddy Nails | Nail Artist in Quigney, East London",
  description:
    "Meet Freddy Nails, a luxury nail studio at 8 Rhodes Street, Quigney, East London (KuGompo City). Detail-focused nail artistry and personalised designs.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    url: "/about",
    title: "About Freddy Nails | East London Nail Studio",
    description:
      "Detail-focused nail artistry and personalised designs in Quigney, East London (KuGompo City).",
  },
};

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
