"use client";

import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full bg-black text-white">
      {/* Account announcement */}
      <div className="border-b border-white/10 bg-[#171514]">
        <div className="max-w-[1400px] mx-auto px-5 py-3 flex items-center justify-center gap-3 text-center">
          <span className="text-[#d9b86c] text-lg">✦</span>

          <p className="text-sm md:text-base text-[#eadfca]">
            Create your Freddy Nails account to book your appointment,
            manage your bookings and enjoy a seamless experience.
          </p>

          <Link
            href="/account/register"
            className="shrink-0 text-sm md:text-base font-medium text-[#e5c56f] underline underline-offset-4 hover:text-white transition-colors"
          >
            Create Account
          </Link>

          <button
            type="button"
            aria-label="Close announcement"
            className="ml-4 hidden sm:block text-[#e5c56f] text-2xl leading-none hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="border-b border-white/15">
        <div className="max-w-[1400px] mx-auto px-5 py-5">
          <div className="flex items-center justify-between gap-6">

            {/* Logo + Freddy Nails */}
            <Link
              href="/"
              className="flex items-center gap-4 shrink-0 group"
              aria-label="Freddy Nails Home"
            >
              <div className="relative w-[68px] h-[68px] md:w-[78px] md:h-[78px] rounded-full overflow-hidden shrink-0">
                <Image
                  src="/freddy-nails-logo.png"
                  alt="Freddy Nails"
                  fill
                  priority
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="78px"
                />
              </div>

              <span className="font-serif text-[2rem] md:text-[2.5rem] text-[#e5c56f] leading-none">
                Freddy Nails
              </span>
            </Link>

            {/* Navigation links */}
            <div className="hidden lg:flex items-center gap-8">
              <Link
                href="/"
                className="text-[#e5c56f] font-medium border-b-2 border-[#e5c56f] pb-2"
              >
                Home
              </Link>

              <Link
                href="/#about"
                className="text-white hover:text-[#e5c56f] transition-colors"
              >
                About
              </Link>

              <Link
                href="/#services"
                className="text-white hover:text-[#e5c56f] transition-colors"
              >
                Services
              </Link>

              <Link
                href="/#gallery"
                className="text-white hover:text-[#e5c56f] transition-colors"
              >
                Gallery
              </Link>

              <Link
                href="/#reviews"
                className="text-white hover:text-[#e5c56f] transition-colors"
              >
                Reviews
              </Link>

              <Link
                href="/#contact"
                className="text-white hover:text-[#e5c56f] transition-colors"
              >
                Contact
              </Link>
            </div>

            {/* Account + Booking */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/account"
                className="hidden sm:flex items-center justify-center gap-2 h-12 px-5 rounded-md border border-[#8f7440] text-white hover:border-[#e5c56f] hover:text-[#e5c56f] transition-colors"
              >
                <span className="text-lg">♙</span>
                <span>My Account</span>
              </Link>

              <Link
                href="/book"
                className="flex items-center justify-center gap-2 h-12 px-6 rounded-md bg-[#e5c56f] text-[#171514] font-semibold hover:bg-[#f0d88f] transition-colors"
              >
                <span className="text-lg">▣</span>
                <span>Book Now</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
