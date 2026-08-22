"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    loadAccount();
  }, []);
  async function loadAccount() {
    try {
      setLoading(true);
      setError("");
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        throw userError;
      }
      if (!currentUser) {
        window.location.href = "/account/login";
        return;
      }
      setUser(currentUser);
      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("full_name, phone, email")
          .eq("id", currentUser.id)
          .maybeSingle();
      if (profileError) {
        throw profileError;
      }
      setProfile(profileData);
    } catch (err) {
      console.error("Account loading error:", err);
      setError(
        err?.message ||
          "We couldn't load your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }
  async function handleLogout() {
    setLoggingOut(true);
    try {
      const { error: logoutError } =
        await supabase.auth.signOut();
      if (logoutError) {
        throw logoutError;
      }
      window.location.href = "/account/login";
    } catch (err) {
      console.error("Logout error:", err);
      setError(
        err?.message ||
          "We couldn't log you out. Please try again."
      );
      setLoggingOut(false);
    }
  }
  if (loading) {
    return (
      <main className="min-h-screen bg-[#11100f] px-5 py-16 text-[#f4eee6]">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
            Freddy Nails
          </p>
          <div className="mt-10 h-8 w-48 animate-pulse bg-[#181614]" />
          <div className="mt-8 grid gap-px bg-white/[0.08] md:grid-cols-3">
            <div className="h-40 animate-pulse bg-[#181614]" />
            <div className="h-40 animate-pulse bg-[#181614]" />
            <div className="h-40 animate-pulse bg-[#181614]" />
          </div>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-[#11100f] px-5 py-10 text-[#f4eee6] md:py-16">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <a
              href="/"
              className="text-sm text-[#a79a87] transition-colors hover:text-[#d6b36a]"
            >
              ← Freddy Nails
            </a>
            <p className="mt-8 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
              Client Account
            </p>
            <h1 className="mt-3 font-serif text-4xl text-[#f4eee6] md:text-5xl">
              Welcome back
              {profile?.full_name
                ? `, ${profile.full_name.split(" ")[0]}`
                : ""}
              .
            </h1>
            <p className="mt-4 max-w-[620px] text-sm leading-relaxed text-[#a79a87]">
              Manage your Freddy Nails appointments, profile
              and booking history from one place.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-sm border border-white/[0.12] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#c9c0b6] transition-colors hover:border-[#d6b36a] hover:text-[#d6b36a] disabled:opacity-50"
          >
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
        {error && (
          <div className="mt-8 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        <div className="mt-12 grid gap-px bg-white/[0.08] md:grid-cols-3">
          <div className="bg-[#181614] p-6">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#d6b36a]">
              Upcoming appointment
            </p>
            <p className="mt-5 font-serif text-2xl text-[#f4eee6]">
              No appointment yet
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#8f877e]">
              Your upcoming bookings will appear here once
              your account is connected to the booking system.
            </p>
          </div>
          <div className="bg-[#181614] p-6">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#d6b36a]">
              Booking status
            </p>
            <p className="mt-5 font-serif text-2xl text-[#f4eee6]">
              Ready to book
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#8f877e]">
              Your booking status and appointment approval will
              appear here.
            </p>
          </div>
          <div className="bg-[#181614] p-6">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#d6b36a]">
              Deposit
            </p>
            <p className="mt-5 font-serif text-2xl text-[#f4eee6]">
              R90
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#8f877e]">
              A R90 deposit is required to secure your
              appointment slot.
            </p>
          </div>
        </div>
        <section className="mt-10 border border-white/[0.09] bg-[#181614]">
          <div className="border-b border-white/[0.09] px-6 py-5">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#d6b36a]">
              Your profile
            </p>
          </div>
          <div className="grid gap-6 p-6 md:grid-cols-3">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#817970]">
                Full name
              </p>
              <p className="mt-2 text-sm text-[#f4eee6]">
                {profile?.full_name || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#817970]">
                Email
              </p>
              <p className="mt-2 break-all text-sm text-[#f4eee6]">
                {profile?.email ||
                  user?.email ||
                  "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#817970]">
                Phone
              </p>
              <p className="mt-2 text-sm text-[#f4eee6]">
                {profile?.phone || "Not provided"}
              </p>
            </div>
          </div>
        </section>
        <section className="mt-10 border border-white/[0.09] bg-[#181614]">
          <div className="border-b border-white/[0.09] px-6 py-5">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#d6b36a]">
              Booking history
            </p>
          </div>
          <div className="px-6 py-10 text-center">
            <p className="font-serif text-2xl text-[#f4eee6]">
              No booking history yet
            </p>
            <p className="mx-auto mt-3 max-w-[480px] text-sm leading-relaxed text-[#8f877e]">
              Once your account is connected to the Freddy
              Nails booking system, your previous appointments
              will appear here.
            </p>
            <a
              href="/#booking"
              className="mt-6 inline-flex rounded-sm bg-[#d6b36a] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#11100f] transition-colors hover:bg-[#ad8a4e]"
            >
              Book an appointment
            </a>
          </div>
        </section>
        <div className="mt-10 border-t border-white/[0.09] pt-6 text-center">
          <p className="text-xs text-[#817970]">
            Freddy Nails · Crafted to Perfection
          </p>
        </div>
      </div>
    </main>
  );
}
