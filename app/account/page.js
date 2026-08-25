"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";

  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timeString: string | null | undefined) {
  if (!timeString) return "—";

  const [hours, minutes] = timeString.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return timeString;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-ZA", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatStatus(status: string | null | undefined) {
  if (!status) return "Pending";

  const value = String(status)
    .replace(/_/g, " ")
    .toLowerCase();

  return value.replace(/\b\w/g, (letter) =>
    letter.toUpperCase()
  );
}

function statusClass(status: string | null | undefined) {
  const value = String(status || "").toLowerCase();

  if (value === "confirmed") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (value === "deposit paid" || value === "deposit_paid") {
    return "border-[#d6b36a]/30 bg-[#d6b36a]/10 text-[#d6b36a]";
  }

  if (value === "approved") {
    return "border-blue-400/30 bg-blue-400/10 text-blue-300";
  }

  if (value === "cancelled" || value === "canceled") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-white/[0.12] bg-white/[0.04] text-[#c9c0b6]";
}

function paymentLabel(status: string | null | undefined) {
  const value = String(status || "").toLowerCase();

  if (value === "paid" || value === "deposit_paid") {
    return "Deposit Paid";
  }

  if (value === "failed") {
    return "Payment Failed";
  }

  if (value === "cancelled") {
    return "Cancelled";
  }

  return "Deposit Pending";
}

function isCancelledBooking(appointment: any) {
  const status = String(
    appointment?.booking_status || ""
  ).toLowerCase();

  return status === "cancelled" || status === "canceled";
}

function isUnpaidBooking(appointment: any) {
  const bookingStatus = String(
    appointment?.booking_status || ""
  ).toLowerCase();

  const paymentStatus = String(
    appointment?.payment_status || ""
  ).toLowerCase();

  return (
    (bookingStatus === "pending" ||
      bookingStatus === "approved") &&
    paymentStatus !== "paid" &&
    paymentStatus !== "deposit_paid"
  );
}

function getAppointmentDate(appointment: any) {
  if (!appointment?.booking_date) return null;

  const date = new Date(
    `${appointment.booking_date}T00:00:00`
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");

  async function loadAccount() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        window.location.href = "/account/login";
        return;
      }

      const currentUser = session.user;

      setUser(currentUser);

      const [profileResult, appointmentsResult] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, phone, email")
            .eq("id", currentUser.id)
            .maybeSingle(),

          supabase
            .from("appointments")
            .select(`
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
              created_at,
              expires_at,
              promo_code
            `)
            .eq("profile_id", currentUser.id)
            .order("booking_date", {
              ascending: true,
            })
            .order("start_time", {
              ascending: true,
            }),
        ]);

      if (appointmentsResult.error) {
        throw appointmentsResult.error;
      }

      setProfile(profileResult.data || null);
      setAppointments(appointmentsResult.data || []);
    } catch (err: any) {
      console.error("Account loading error:", err);

      if (
        String(err?.message || "")
          .toLowerCase()
          .includes("auth session missing")
      ) {
        window.location.href = "/account/login";
        return;
      }

      setError(
        err?.message ||
          "Unable to load your account."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccount();
  }, []);

  async function getAccessToken() {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }

    return session.access_token;
  }

  async function handlePayDeposit(appointment: any) {
    if (!appointment?.id) return;

    setActionError("");
    setMessage("");
    setActionLoading(`pay-${appointment.id}`);

    try {
      const accessToken = await getAccessToken();

      const response = await fetch(
        "/api/account/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            appointmentId: appointment.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to start payment."
        );
      }

      if (!data?.redirectUrl) {
        throw new Error(
          "Yoco did not return a payment link."
        );
      }

      window.location.href = data.redirectUrl;
    } catch (err: any) {
      console.error(
        "Deposit payment error:",
        err
      );

      setActionError(
        err?.message ||
          "Unable to start the deposit payment."
      );

      setActionLoading(null);
    }
  }

  async function handleCancelBooking(
    appointment: any
  ) {
    if (!appointment?.id) return;

    const paymentStatus = String(
      appointment.payment_status || ""
    ).toLowerCase();

    const isPaid =
      paymentStatus === "paid" ||
      paymentStatus === "deposit_paid";

    const confirmationMessage = isPaid
      ? "Are you sure you want to cancel this confirmed appointment?\n\nYour Google Calendar appointment will be removed and your time slot will be released.\n\nYour deposit will NOT be automatically refunded.\n\nContinue with cancellation?"
      : "Are you sure you want to cancel this booking?\n\nYour selected time will be released.\n\nContinue with cancellation?";

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setActionError("");
    setMessage("");
    setActionLoading(`cancel-${appointment.id}`);

    try {
      const accessToken = await getAccessToken();

      const response = await fetch(
        "/api/account/cancel-booking",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            appointmentId: appointment.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to cancel this booking."
        );
      }

      setMessage(
        isPaid
          ? "Your confirmed appointment has been cancelled successfully. Your deposit is not automatically refunded."
          : "Your booking has been cancelled successfully."
      );

      setActionLoading(null);

      await loadAccount();
    } catch (err: any) {
      console.error(
        "Cancel booking error:",
        err
      );

      setActionError(
        err?.message ||
          "Unable to cancel your booking."
      );

      setActionLoading(null);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const today = getToday();

  const activeAppointments = appointments.filter(
    (appointment) =>
      !isCancelledBooking(appointment)
  );

  const upcomingAppointments =
    activeAppointments.filter((appointment) => {
      const date = getAppointmentDate(appointment);
      return date && date >= today;
    });

  const upcoming =
    upcomingAppointments[0] || null;

  const history = appointments.filter(
    (appointment) => {
      const date = getAppointmentDate(appointment);

      return (
        !date ||
        date < today ||
        isCancelledBooking(appointment)
      );
    }
  );

  const previousNonCancelledBookings =
    appointments.filter(
      (appointment) =>
        !isCancelledBooking(appointment)
    );

  /*
   * SPECIALS & PROMOS
   *
   * FIRSTVISIT:
   * Available only when the client has no previous
   * non-cancelled appointment.
   *
   * FRIEND50:
   * Available when booking 2+ clients.
   *
   * BIRTHDAY:
   * Displayed as an account offer and can still
   * be entered during booking.
   *
   * The API remains the final authority and
   * recalculates the discount server-side.
   */

  const isFirstVisit =
    previousNonCancelledBookings.length === 0;

  const hasUsedFirstVisit =
    appointments.some(
      (appointment) =>
        String(
          appointment?.promo_code || ""
        ).toUpperCase() === "FIRSTVISIT"
    );

  const hasUsedFriendOffer =
    appointments.some(
      (appointment) =>
        String(
          appointment?.promo_code || ""
        ).toUpperCase() === "FRIEND50"
    );

  const hasUsedBirthdayOffer =
    appointments.some(
      (appointment) =>
        String(
          appointment?.promo_code || ""
        ).toUpperCase() === "BIRTHDAY"
    );

  const promos = useMemo(
    () => [
      {
        code: "FIRSTVISIT",
        label: "First Visit",
        title: "15% off your first visit",
        description:
          "Your first Freddy Nails appointment comes with 15% off the service total.",
        available:
          isFirstVisit && !hasUsedFirstVisit,
        used: hasUsedFirstVisit,
        badge: "WELCOME OFFER",
      },
      {
        code: "FRIEND50",
        label: "Bring a Friend",
        title: "R50 off when you bring a friend",
        description:
          "Book two or more clients together and receive R50 off the service total.",
        available: !hasUsedFriendOffer,
        used: hasUsedFriendOffer,
        badge: "REFERRAL",
      },
      {
        code: "BIRTHDAY",
        label: "Birthday",
        title: "R50 birthday special",
        description:
          "Enjoy R50 off your service total as part of your birthday offer.",
        available: !hasUsedBirthdayOffer,
        used: hasUsedBirthdayOffer,
        badge: "BIRTHDAY",
      },
    ],
    [
      isFirstVisit,
      hasUsedFirstVisit,
      hasUsedFriendOffer,
      hasUsedBirthdayOffer,
    ]
  );

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Client";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#11100f] px-5 py-16 text-[#f4eee6]">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-sm text-[#8f877e]">
            Loading your account...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#11100f] px-5 py-16 text-[#f4eee6]">
        <div className="mx-auto max-w-[520px]">
          <a
            href="/"
            className="text-sm text-[#a79a87] hover:text-[#d6b36a]"
          >
            ← Back to Freddy Nails
          </a>

          <div className="mt-10 border border-red-400/30 bg-red-400/10 px-5 py-4">
            <p className="text-sm text-red-300">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={loadAccount}
            className="mt-5 bg-[#d6b36a] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#11100f]"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#11100f] px-5 py-12 text-[#f4eee6]">
      <div className="mx-auto max-w-[1180px]">

        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <a
              href="/"
              className="text-sm text-[#a79a87] hover:text-[#d6b36a]"
            >
              ← Freddy Nails
            </a>

            <p className="mt-8 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
              Client account
            </p>

            <h1 className="mt-2 font-serif text-4xl text-[#f4eee6]">
              Welcome, {displayName}.
            </h1>

            <p className="mt-3 max-w-[620px] text-sm leading-relaxed text-[#a79a87]">
              Manage your appointments, deposits,
              profile and exclusive offers from here.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="border border-white/[0.12] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#c9c0b6] hover:border-[#d6b36a]/40 hover:text-[#d6b36a]"
          >
            Log out
          </button>
        </div>

        {message && (
          <div className="mt-8 border border-[#d6b36a]/30 bg-[#d6b36a]/10 px-5 py-4 text-sm text-[#d6b36a]">
            {message}
          </div>
        )}

        {actionError && (
          <div className="mt-8 border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {actionError}
          </div>
        )}

        {/* SPECIALS */}
        <section className="mt-12">
          <div className="mb-5">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
              Ways to save
            </p>

            <h2 className="mt-2 font-serif text-2xl text-[#f4eee6]">
              Your specials & promos
            </h2>

            <p className="mt-2 max-w-[650px] text-sm leading-relaxed text-[#8f877e]">
              Exclusive offers available through your
              Freddy Nails client account.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {promos.map((promo) => (
              <div
                key={promo.code}
                className={`relative border p-6 ${
                  promo.available
                    ? "border-[#d6b36a]/30 bg-[#181614]"
                    : "border-white/[0.08] bg-[#151311]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="border border-[#d6b36a]/30 px-2.5 py-1 text-[0.55rem] font-bold uppercase tracking-[0.14em] text-[#d6b36a]">
                    {promo.badge}
                  </span>

                  {promo.used && (
                    <span className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#817970]">
                      Used
                    </span>
                  )}
                </div>

                <h3 className="mt-5 font-serif text-xl text-[#f4eee6]">
                  {promo.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-[#8f877e]">
                  {promo.description}
                </p>

                {promo.available ? (
                  <a
                    href={`/account/book?promo=${promo.code}`}
                    className="mt-5 inline-flex border border-[#d6b36a]/40 px-4 py-2.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#d6b36a] hover:bg-[#d6b36a]/10"
                  >
                    Use this offer →
                  </a>
                ) : promo.code === "FIRSTVISIT" ? (
                  <p className="mt-5 text-[0.65rem] uppercase tracking-[0.1em] text-[#817970]">
                    First visit offer already used
                  </p>
                ) : (
                  <a
                    href={`/account/book?promo=${promo.code}`}
                    className="mt-5 inline-flex border border-white/[0.10] px-4 py-2.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#a79a87] hover:border-[#d6b36a]/30 hover:text-[#d6b36a]"
                  >
                    View offer →
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 border border-white/[0.07] bg-[#151311] px-5 py-4">
            <p className="text-xs leading-relaxed text-[#817970]">
              Promotions apply to eligible service totals.
              Your booking deposit remains R90 per client and
              is not reduced by promotional discounts.
            </p>
          </div>
        </section>

        {/* UPCOMING */}
        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
                Your booking
              </p>

              <h2 className="mt-2 font-serif text-2xl text-[#f4eee6]">
                Upcoming appointment
              </h2>
            </div>

            <a
              href="/account/book"
              className="hidden sm:inline-flex bg-[#d6b36a] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#11100f] hover:bg-[#ad8a4e]"
            >
              Book an appointment →
            </a>
          </div>

          {upcoming ? (
            <div className="border border-white/[0.10] bg-[#181614]">
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[#8f877e]">
                      Appointment date
                    </p>

                    <p className="mt-2 font-serif text-2xl text-[#f4eee6]">
                      {formatDate(
                        upcoming.booking_date
                      )}
                    </p>

                    <p className="mt-1 text-sm text-[#a79a87]">
                      {formatTime(upcoming.start_time)}{" "}
                      –{" "}
                      {formatTime(upcoming.end_time)}
                    </p>
                  </div>

                  <span
                    className={`border px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] ${statusClass(
                      upcoming.booking_status
                    )}`}
                  >
                    {formatStatus(
                      upcoming.booking_status
                    )}
                  </span>
                </div>

                <div className="mt-7 border-t border-white/[0.08] pt-6">
                  <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[#8f877e]">
                    Services
                  </p>

                  <p className="mt-2 text-sm leading-relaxed text-[#c9c0b6]">
                    {upcoming.service_name}
                  </p>
                </div>

                {upcoming.promo_code && (
                  <div className="mt-5 border border-[#d6b36a]/20 bg-[#d6b36a]/[0.04] px-4 py-3">
                    <p className="text-xs text-[#d6b36a]">
                      Promotion applied:{" "}
                      <strong>
                        {upcoming.promo_code}
                      </strong>
                    </p>
                  </div>
                )}

                <div className="mt-7 grid gap-5 border-t border-white/[0.08] pt-6 sm:grid-cols-3">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[#8f877e]">
                      Clients
                    </p>

                    <p className="mt-1 text-sm text-[#f4eee6]">
                      {upcoming.client_count}
                    </p>
                  </div>

                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[#8f877e]">
                      Deposit
                    </p>

                    <p className="mt-1 text-sm text-[#d6b36a]">
                      R
                      {Number(
                        upcoming.deposit_amount || 0
                      ).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[#8f877e]">
                      Payment
                    </p>

                    <p className="mt-1 text-sm text-[#f4eee6]">
                      {paymentLabel(
                        upcoming.payment_status
                      )}
                    </p>
                  </div>
                </div>

                {isUnpaidBooking(upcoming) && (
                  <div className="mt-7 border-t border-[#d6b36a]/20 pt-6">
                    <p className="text-sm leading-relaxed text-[#a79a87]">
                      Your booking is being held for you.
                      Complete the R
                      {Number(
                        upcoming.deposit_amount || 0
                      ).toFixed(0)}{" "}
                      deposit to secure your appointment.
                    </p>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() =>
                          handlePayDeposit(upcoming)
                        }
                        disabled={actionLoading !== null}
                        className="inline-flex items-center justify-center bg-[#d6b36a] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[#11100f] hover:bg-[#ad8a4e] disabled:opacity-50"
                      >
                        {actionLoading ===
                        `pay-${upcoming.id}`
                          ? "Opening payment..."
                          : `Pay R${Number(
                              upcoming.deposit_amount || 0
                            ).toFixed(0)} Deposit →`}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleCancelBooking(upcoming)
                        }
                        disabled={actionLoading !== null}
                        className="inline-flex items-center justify-center border border-red-400/30 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-red-300 hover:bg-red-400/10 disabled:opacity-50"
                      >
                        {actionLoading ===
                        `cancel-${upcoming.id}`
                          ? "Cancelling..."
                          : "Cancel Booking"}
                      </button>
                    </div>
                  </div>
                )}

                {!isUnpaidBooking(upcoming) &&
                  String(
                    upcoming.booking_status || ""
                  ).toLowerCase() === "confirmed" && (
                    <div className="mt-7 border-t border-emerald-400/20 pt-6">
                      <p className="text-sm text-emerald-300">
                        Your appointment is confirmed.
                        We look forward to seeing you.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          handleCancelBooking(upcoming)
                        }
                        disabled={actionLoading !== null}
                        className="mt-5 inline-flex items-center justify-center border border-red-400/30 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-red-300 hover:bg-red-400/10 disabled:opacity-50"
                      >
                        {actionLoading ===
                        `cancel-${upcoming.id}`
                          ? "Cancelling..."
                          : "Cancel Booking"}
                      </button>

                      <p className="mt-3 text-xs leading-relaxed text-[#817970]">
                        Cancelling a confirmed appointment
                        releases your time slot. Deposits are
                        not automatically refunded.
                      </p>
                    </div>
                  )}

                {!isUnpaidBooking(upcoming) &&
                  String(
                    upcoming.booking_status || ""
                  ).toLowerCase() === "approved" && (
                    <div className="mt-7 border-t border-[#d6b36a]/20 pt-6">
                      <p className="text-sm text-[#d6b36a]">
                        Your booking has been approved.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          handleCancelBooking(upcoming)
                        }
                        disabled={actionLoading !== null}
                        className="mt-5 inline-flex items-center justify-center border border-red-400/30 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-red-300 hover:bg-red-400/10 disabled:opacity-50"
                      >
                        {actionLoading ===
                        `cancel-${upcoming.id}`
                          ? "Cancelling..."
                          : "Cancel Booking"}
                      </button>
                    </div>
                  )}
              </div>
            </div>
          ) : (
            <div className="border border-white/[0.10] bg-[#181614] p-7 md:p-8">
              <p className="font-serif text-xl text-[#f4eee6]">
                No upcoming appointment.
              </p>

              <p className="mt-2 max-w-[560px] text-sm leading-relaxed text-[#8f877e]">
                Ready for your next set? Choose a
                service and book your appointment.
              </p>

              <a
                href="/account/book"
                className="mt-6 inline-flex bg-[#d6b36a] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#11100f]"
              >
                Book an appointment →
              </a>
            </div>
          )}
        </section>

        {/* PROFILE */}
        <section className="mt-12">
          <div className="border border-white/[0.10] bg-[#181614] p-6 md:p-8">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
              Profile
            </p>

            <h2 className="mt-2 font-serif text-2xl text-[#f4eee6]">
              Your details
            </h2>

            <div className="mt-7 grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[#8f877e]">
                  Full name
                </p>

                <p className="mt-1 text-sm text-[#f4eee6]">
                  {profile?.full_name || displayName}
                </p>
              </div>

              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[#8f877e]">
                  Phone
                </p>

                <p className="mt-1 text-sm text-[#f4eee6]">
                  {profile?.phone ||
                    user?.user_metadata?.phone ||
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[#8f877e]">
                  Email
                </p>

                <p className="mt-1 break-all text-sm text-[#f4eee6]">
                  {profile?.email ||
                    user?.email ||
                    "—"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HISTORY */}
        <section className="mt-12 pb-16">
          <div className="mb-5">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
              Past bookings
            </p>

            <h2 className="mt-2 font-serif text-2xl text-[#f4eee6]">
              Booking history
            </h2>
          </div>

          {history.length > 0 ? (
            <div className="space-y-3">
              {history
                .slice()
                .reverse()
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border border-white/[0.08] bg-[#181614] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#f4eee6]">
                          {formatDate(
                            appointment.booking_date
                          )}
                        </p>

                        <p className="mt-1 text-xs text-[#8f877e]">
                          {formatTime(
                            appointment.start_time
                          )}{" "}
                          –{" "}
                          {formatTime(
                            appointment.end_time
                          )}
                        </p>
                      </div>

                      <span
                        className={`border px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] ${statusClass(
                          appointment.booking_status
                        )}`}
                      >
                        {formatStatus(
                          appointment.booking_status
                        )}
                      </span>
                    </div>

                    <p className="mt-4 text-xs leading-relaxed text-[#a79a87]">
                      {appointment.service_name}
                    </p>

                    {appointment.promo_code && (
                      <p className="mt-3 text-[0.68rem] text-[#d6b36a]">
                        Promotion:{" "}
                        {appointment.promo_code}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[0.68rem] text-[#817970]">
                      <span>
                        Deposit:{" "}
                        <span className="text-[#c9c0b6]">
                          R
                          {Number(
                            appointment.deposit_amount || 0
                          ).toFixed(2)}
                        </span>
                      </span>

                      <span>
                        Payment:{" "}
                        <span className="text-[#c9c0b6]">
                          {paymentLabel(
                            appointment.payment_status
                          )}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="border border-white/[0.08] bg-[#181614] p-6">
              <p className="text-sm text-[#8f877e]">
                No previous bookings yet.
              </p>
            </div>
          )}
        </section>

        <div className="pb-10 sm:hidden">
          <a
            href="/account/book"
            className="flex w-full items-center justify-center bg-[#d6b36a] px-5 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[#11100f]"
          >
            Book an appointment →
          </a>
        </div>
      </div>
    </main>
  );
}
