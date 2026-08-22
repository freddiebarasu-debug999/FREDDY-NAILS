"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
function formatDate(dateString) {
  if (!dateString) return "Date not set";
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatTime(timeString) {
  if (!timeString) return "";
  const [hours, minutes] = timeString.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
function formatStatus(status) {
  if (!status) return "Pending";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("confirmed")) {
    return "border-green-400/30 bg-green-400/10 text-green-300";
  }
  if (value.includes("deposit") || value.includes("approved")) {
    return "border-[#d6b36a]/30 bg-[#d6b36a]/10 text-[#d6b36a]";
  }
  if (value.includes("cancel") || value.includes("reject")) {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }
  return "border-white/[0.12] bg-white/[0.04] text-[#c9c0b6]";
}
function paymentLabel(status) {
  const value = String(status || "").toLowerCase();
  if (
    value.includes("paid") ||
    value.includes("success") ||
    value.includes("completed")
  ) {
    return "Paid";
  }
  return "Not paid";
}
export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
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
      const { data: appointmentData, error: appointmentError } =
        await supabase
          .from("appointments")
          .select(
            `
              id,
              customer_name,
              customer_phone,
              customer_email,
              service_name,
              client_count,
              booking_date,
              start_time,
              end_time,
              duration_minutes,
              deposit_per_client,
              deposit_amount,
              payment_status,
              booking_status,
              notes,
              created_at
            `
          )
          .eq("profile_id", currentUser.id)
          .order("booking_date", { ascending: true })
          .order("start_time", { ascending: true });
      if (appointmentError) {
        throw appointmentError;
      }
      setAppointments(appointmentData || []);
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingAppointments = appointments.filter((appointment) => {
    if (!appointment.booking_date) return false;
    const appointmentDate = new Date(
      `${appointment.booking_date}T00:00:00`
    );
    return appointmentDate >= today;
  });
  const upcomingAppointment = upcomingAppointments[0];
  const historyAppointments = appointments.filter((appointment) => {
    if (!appointment.booking_date) return true;
    const appointmentDate = new Date(
      `${appointment.booking_date}T00:00:00`
    );
    return appointmentDate < today;
  });
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
        {/* Header */}
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
        {/* Error */}
        {error && (
          <div className="mt-8 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        {/* Summary Cards */}
        <div className="mt-12 grid gap-px bg-white/[0.08] md:grid-cols-3">
          {/* Upcoming */}
          <div className="bg-[#181614] p-6">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#d6b36a]">
              Upcoming appointment
            </p>
            {upcomingAppointment ? (
              <>
                <p className="mt-5 font-serif text-xl text-[#f4eee6]">
                  {formatDate(
                    upcomingAppointment.booking_date
                  )}
                </p>
                <p className="mt-2 text-sm text-[#c9c0b6]">
                  {formatTime(
                    upcomingAppointment.start_time
                  )}
                  {upcomingAppointment.end_time
                    ? ` – ${formatTime(
                        upcomingAppointment.end_time
                      )}`
                    : ""}
                </p>
                <p className="mt-3 text-sm text-[#8f877e]">
                  {upcomingAppointment.service_name}
                </p>
              </>
            ) : (
              <>
                <p className="mt-5 font-serif text-2xl text-[#f4eee6]">
                  No appointment yet
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#8f877e]">
                  Book your next Freddy Nails appointment
                  to see it here.
                </p>
              </>
            )}
          </div>
          {/* Booking Status */}
          <div className="bg-[#181614] p-6">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#d6b36a]">
              Booking status
            </p>
            {upcomingAppointment ? (
              <>
                <div
                  className={`mt-5 inline-flex border px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] ${statusClass(
                    upcomingAppointment.booking_status
                  )}`}
                >
                  {formatStatus(
                    upcomingAppointment.booking_status
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#8f877e]">
                  Your appointment status will update here
                  as Freddy processes your booking.
                </p>
              </>
            ) : (
              <>
                <p className="mt-5 font-serif text-2xl text-[#f4eee6]">
                  Ready to book
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#8f877e]">
                  Your booking status will appear here once
                  you make an appointment.
                </p>
              </>
            )}
          </div>
          {/* Deposit */}
          <div className="bg-[#181614] p-6">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#d6b36a]">
              Deposit
            </p>
            {upcomingAppointment ? (
              <>
                <p className="mt-5 font-serif text-2xl text-[#f4eee6]">
                  R
                  {Number(
                    upcomingAppointment.deposit_amount || 0
                  ).toFixed(2)}
                </p>
                <p className="mt-2 text-sm text-[#8f877e]">
                  {paymentLabel(
                    upcomingAppointment.payment_status
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="mt-5 font-serif text-2xl text-[#f4eee6]">
                  R90
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#8f877e]">
                  A R90 deposit is required to secure your
                  appointment slot.
                </p>
              </>
            )}
          </div>
        </div>
        {/* Upcoming Appointment Details */}
        {upcomingAppointment && (
          <section className="mt-10 border border-white/[0.09] bg-[#181614]">
            <div className="border-b border-white/[0.09] px-6 py-5">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#d6b36a]">
                Appointment details
              </p>
            </div>
            <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#817970]">
                  Service
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#f4eee6]">
                  {upcomingAppointment.service_name}
                </p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#817970]">
                  Date
                </p>
                <p className="mt-2 text-sm text-[#f4eee6]">
                  {formatDate(
                    upcomingAppointment.booking_date
                  )}
                </p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#817970]">
                  Time
                </p>
                <p className="mt-2 text-sm text-[#f4eee6]">
                  {formatTime(
                    upcomingAppointment.start_time
                  )}
                  {upcomingAppointment.end_time
                    ? ` – ${formatTime(
                        upcomingAppointment.end_time
                      )}`
                    : ""}
                </p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#817970]">
                  Deposit
                </p>
                <p className="mt-2 text-sm text-[#f4eee6]">
                  R
                  {Number(
                    upcomingAppointment.deposit_amount || 0
                  ).toFixed(2)}{" "}
                  ·{" "}
                  {paymentLabel(
                    upcomingAppointment.payment_status
                  )}
                </p>
              </div>
            </div>
          </section>
        )}
        {/* Profile */}
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
        {/* Booking History */}
        <section className="mt-10 border border-white/[0.09] bg-[#181614]">
          <div className="border-b border-white/[0.09] px-6 py-5">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#d6b36a]">
              Booking history
            </p>
          </div>
          {historyAppointments.length > 0 ? (
            <div className="divide-y divide-white/[0.08]">
              {historyAppointments
                .slice()
                .reverse()
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_auto_auto] md:items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#f4eee6]">
                        {appointment.service_name}
                      </p>
                      <p className="mt-1 text-xs text-[#8f877e]">
                        {formatDate(
                          appointment.booking_date
                        )}
                        {appointment.start_time
                          ? ` · ${formatTime(
                              appointment.start_time
                            )}`
                          : ""}
                      </p>
                    </div>
                    <div
                      className={`inline-flex w-fit border px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.08em] ${statusClass(
                        appointment.booking_status
                      )}`}
                    >
                      {formatStatus(
                        appointment.booking_status
                      )}
                    </div>
                    <div className="text-sm text-[#c9c0b6]">
                      R
                      {Number(
                        appointment.deposit_amount || 0
                      ).toFixed(2)}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="font-serif text-2xl text-[#f4eee6]">
                No booking history yet
              </p>
              <p className="mx-auto mt-3 max-w-[480px] text-sm leading-relaxed text-[#8f877e]">
                Your previous Freddy Nails appointments
                will appear here automatically.
              </p>
              <a
                href="/#booking"
                className="mt-6 inline-flex rounded-sm bg-[#d6b36a] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#11100f] transition-colors hover:bg-[#ad8a4e]"
              >
                Book an appointment
              </a>
            </div>
          )}
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
