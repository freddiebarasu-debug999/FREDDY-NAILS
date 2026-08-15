# Freddy Nails — Next.js Site

A premium, mobile-first nail studio website built with Next.js (App Router),
React and Tailwind CSS, per the project brief.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Structure

```
app/
  layout.js       Root layout, fonts (Fraunces + Manrope), metadata
  page.js         Assembles all sections
  globals.css     Tailwind directives + base styles
components/
  Header.js       Sticky nav + mobile menu
  Hero.js         Home hero
  About.js        About section
  Services.js     Services & pricing grid (edit the SERVICES array)
  ShapeGuide.js   Signature "find your shape" strip (SVG nail shapes)
  Gallery.js      Gallery grid — placeholder tiles, swap for real photos
  Booking.js      Booking form that opens a pre-filled WhatsApp chat
  Offers.js       Current promotions (edit the OFFERS array)
  Reviews.js      Auto-rotating testimonial carousel
  FAQ.js          Accordion FAQ
  Contact.js      Contact details + map placeholder
  Footer.js       Footer
```

## Before you launch — things to swap

1. **WhatsApp number** — in `components/Booking.js`, replace
   `WHATSAPP_NUMBER` with your real number (digits only, country code, no
   `+` or spaces).
2. **Gallery photos** — replace the placeholder gradient tiles in
   `components/Gallery.js` with real photos using `next/image`:
   ```jsx
   import Image from "next/image";
   <Image src="/gallery/set-1.jpg" alt="Gold-foil French manicure" fill />
   ```
   Add your images to `public/gallery/`.
3. **Map** — replace the placeholder box in `components/Contact.js` with a
   real Google Maps embed (`<iframe src="...">`) or a maps API component.
4. **Contact details, hours, prices, offers** — edit the arrays at the top
   of `Services.js`, `Offers.js`, and the `DETAILS` array in `Contact.js`.
5. **Reviews** — edit the `REVIEWS` array in `components/Reviews.js`.

## Brand tokens

Defined in `tailwind.config.js`: `nude`, `nude-deep`, `ink`, `ink-soft`,
`gold`, `gold-bright`, `blush`, `line`. Fonts: Fraunces (display/serif) and
Manrope (body/sans), loaded via `next/font/google` in `app/layout.js`.

## Future roadmap (per brief)

Payments, loyalty programme, vouchers, admin dashboard, and analytics were
flagged as future scope — not built yet, but the component structure keeps
booking/services logic isolated so they can be wired in later without a
rewrite.
