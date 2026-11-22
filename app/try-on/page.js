import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OfferTab from "@/components/OfferTab";
import ChatBot from "../ChatBot";
import TryYourDesign from "@/components/TryYourDesign";

export const metadata = {
  title: "Try Your Design On The Hand | Freddy Nails East London",
  description:
    "Upload a nail photo and see your design on our glossy white mannequin from every angle. Instant preview from Freddy Nails in Quigney, East London.",
  alternates: { canonical: "https://freddynails.co.za/try-on" },
};

export default function TryOnPage() {
  return (
    <>
      <OfferTab />
      <Header />
      <main className="mx-auto max-w-[900px] px-5 pb-24 pt-14">
        <TryYourDesign />
      </main>
      <Footer />
      <ChatBot />
    </>
  );
}
