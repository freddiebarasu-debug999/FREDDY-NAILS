import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const SITE_URL = "https://freddynails.co.za";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Freddy Nails | Nail Salon in Quigney, East London (KuGompo City)",
  description:
    "Luxury nail studio in Quigney, East London (KuGompo City). Acrylic and gel nails, pedicures, nail art and eyelash extensions. Book online with Freddy Nails.",
  keywords: [
    "nail salon East London",
    "nail salon KuGompo City",
    "acrylic nails East London",
    "gel nails East London",
    "nail art East London",
    "pedicure East London",
    "eyelash extensions East London",
    "nail technician Quigney",
    "Freddy Nails",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Freddy Nails",
    title: "Freddy Nails | Nail Salon in Quigney, East London",
    description:
      "Luxury acrylic and gel nails, pedicures, nail art and lash extensions in Quigney, East London (KuGompo City). Book online.",
    locale: "en_ZA",
    images: [
      {
        url: "/hero-slide-1.jpg",
        alt: "Freddy Nails gold leaf signature set",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Freddy Nails | Nail Salon in Quigney, East London",
    description:
      "Luxury acrylic and gel nails, pedicures, nail art and lash extensions in Quigney, East London (KuGompo City).",
    images: ["/hero-slide-1.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "NailSalon",
  "@id": `${SITE_URL}/#business`,
  name: "Freddy Nails",
  alternateName: "Freddy Nails Studio",
  description:
    "Freddy Nails is a luxury nail studio in Quigney, East London (KuGompo City), Eastern Cape, offering acrylic and gel manicures, pedicures, nail art, eyelash extensions and foot spa treatments by appointment.",
  url: SITE_URL,
  logo: `${SITE_URL}/freddy-nails-logo.png`,
  image: `${SITE_URL}/hero-slide-1.jpg`,
  telephone: "+27710888897",
  address: {
    "@type": "PostalAddress",
    streetAddress: "8 Rhodes Street",
    addressLocality: "Quigney, East London",
    addressRegion: "Eastern Cape",
    postalCode: "5201",
    addressCountry: "ZA",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -33.0200504,
    longitude: 27.9157993,
  },
  areaServed: [
    { "@type": "Place", name: "Quigney" },
    { "@type": "City", name: "East London" },
    { "@type": "City", name: "KuGompo City" },
  ],
  sameAs: [
    "https://instagram.com/nailsby_freddy",
    "https://tiktok.com/@nailsby_freddy",
  ],
  knowsAbout: [
    "Acrylic nails",
    "Gel nails",
    "Nail art",
    "Pedicures",
    "Eyelash extensions",
    "Foot spa",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Freddy Nails services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Acrylic nails" },
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Gel manicures" },
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Pedicures" },
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Nail art" },
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Eyelash extensions" },
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Foot spa" },
      },
    ],
  },
  potentialAction: {
    "@type": "ReserveAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/account/signup`,
      actionPlatform: [
        "http://schema.org/DesktopWebPlatform",
        "http://schema.org/MobileWebPlatform",
      ],
    },
    result: { "@type": "Reservation", name: "Book a nail appointment" },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
