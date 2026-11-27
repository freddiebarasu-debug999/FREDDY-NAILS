"use client";

import Booking from "@/components/Booking";

export default function AccountBookPage() {
  return (
    <main className="min-h-screen bg-[#11100f]">
      <div className="max-w-[1180px] mx-auto px-5 pt-10">
        <a
          href="/account"
          className="text-sm text-[#a79a87] hover:text-[#d6b36a] transition-colors"
        >
          ← Back to My Account
        </a>
        <a
          href="/how-to-book"
          className="block mt-3 text-sm text-[#d6b36a] underline underline-offset-4"
        >
          New here? See how to book
        </a>
      </div>

      <Booking />
    </main>
  );
}
