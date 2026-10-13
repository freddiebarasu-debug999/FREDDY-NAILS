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
      </div>

      <Booking />
    </main>
  );
}
