"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timeString) {
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

function formatStatus(status) {
  if (!status) return "Pending";

  const value = String(status)
    .replace(/_/g, " ")
    .toLowerCase();

  return value.replace(/\b\w/g, (letter) =>
    letter.toUpperCase()
  );
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();

  if (value === "confirmed") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (
    value === "deposit paid" ||
    value === "deposit_paid"
  ) {
    return "border-[#d6b36a]/30 bg-[#d6b36a]/10 text-[#d6b36a]";
  }

  if (value === "approved") {
    return "border-blue-400/30 bg-blue-400/10 text-blue-300";
  }

  if (
    value === "cancelled" ||
    value === "canceled"
  ) {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-white/[0.12] bg-white/[0.04] text-[#c9c0b6]";
}

function paymentLabel(status) {
  const value = String(status || "").toLowerCase();

  if (
    value === "paid" ||
    value === "deposit_paid"
  ) {
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

function isUnpaidBooking(appointment) {
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

function isCancelledBooking(appointment) {
  const bookingStatus = String(
    appointment?.booking_status || ""
  ).toLowerCase();

  return (
    bookingStatus === "cancelled" ||
    bookingStatus === "canceled"
  );
}

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");

  async function loadAccount() {
    setLoading(true);
    setError("");

    try {
      /*
       * First check for an existing session.
       *
       * We deliberately use getSession() here instead of getUser()
       * because a missing session should simply mean the visitor
       * needs to log in.
       */
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error(
          "Session check error:",
          sessionError
        );

        window.location.href = "/account/login";
        return;
      }

      if (!session?.user) {
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
              expires_at
            `)
            .eq("profile_id", currentUser.id)
            .order("booking_date", {
              ascending: true,
            })
            .order("start_time", {
              ascending: true,
            }),
        ]);

      if (profileResult.error) {
        console.error(
          "Profile load error:",
          profileResult.error
        );
      }

      if (appointmentsResult.error) {
        throw appointmentsResult.error;
      }

      setProfile(profileResult.data || null);
      setAppointments(
        appointmentsResult.data || []
      );
    } catch (err) {
      console.error(
        "Account loading error:",
        err
      );

      /*
       * A missing session should never be shown as a
       * scary application error. Send the client back
       * to login instead.
       */
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

    if (sessionError) {
      throw new Error(
        "Your session could not be verified. Please log in again."
      );
    }

    const accessToken =
      session?.access_token;

    if (!accessToken) {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }

    return accessToken;
  }

  async function handlePayDeposit(appointment) {
    if (!appointment?.id) return;

    setActionError("");
    setMessage("");
    setActionLoading(
      `pay-${appointment.id}`
    );

    try {
      const accessToken =
        await getAccessToken();

      const response = await fetch(
        "/api/account/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            appointmentId:
              appointment.id,
          }),
        }
      );

      const data =
        await response.json();

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

      window.location.href =
        data.redirectUrl;
    } catch (err) {
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

  async function handleCancelBooking(appointment) {
    if (!appointment?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?\n\nYour selected time will be released and you will need to make a new booking if you change your mind."
    );

    if (!confirmed) {
      return;
    }

    setActionError("");
    setMessage("");
    setActionLoading(
      `cancel-${appointment.id}`
    );

    try {
      const accessToken =
        await getAccessToken();

      const response = await fetch(
        "/api/account/cancel-booking",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            appointmentId:
              appointment.id,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to cancel this booking."
        );
      }

      setMessage(
        "Your booking has been cancelled successfully."
      );

      setActionLoading(null);

      await loadAccount();
    } catch (err) {
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
            className="mt-5 bg-[#d6b36a] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#11100f] hover:bg-[#ad8a4e]"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeAppointments =
    appointments.filter(
      (appointment) =>
        !isCancelledBooking(appointment)
    );

  const upcomingAppointments =
    activeAppointments.filter(
      (appointment) => {
        const appointmentDate =
          new Date(
            `${appointment.booking_date}T00:00:00`
          );

        return appointmentDate >= today;
      }
    );

  const upcoming =
    upcomingAppointments[0] || null;

  const history = appointments.filter(
    (appointment) => {
      const appointmentDate =
        new Date(
          `${appointment.booking_date}T00:00:00`
        );

      return (
        appointmentDate < today ||
        isCancelledBooking(appointment)
      );
    }
  );

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Client";

  return (
    <main className="min-h-screen bg-[#11100f] px-5 py-12 text-[#f4eee6]">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <a
              href="/"
              className="text-sm text-[#a79a87] transition-colors hover:text-[#d6b36a]"
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
              profile and booking history from here.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="border border-white/[0.12] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#c9c0b6] transition-colors hover:border-[#d6b36a]/40 hover:text-[#d6b36a]"
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
              className="hidden sm:inline-flex bg-[#d6b36a] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#11100f] transition-colors hover:bg-[#ad8a4e]"
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
                      {formatTime(
                        upcoming.start_time
                      )}{" "}
                      –{" "}
                      {formatTime(
                        upcoming.end_time
                      )}
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
                        disabled={
                          actionLoading !== null
                        }
                        className="inline-flex items-center justify-center bg-[#d6b36a] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[#11100f] transition-colors hover:bg-[#ad8a4e] disabled:cursor-not-allowed disabled:opacity-50"
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
                        disabled={
                          actionLoading !== null
                        }
                        className="inline-flex items-center justify-center border border-red-400/30 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-red-300 transition-colors hover:border-red-300/60 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="mt-6 inline-flex bg-[#d6b36a] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#11100f] hover:bg-[#ad8a4e]"
              >
                Book an appointment →
              </a>
            </div>
          )}
        </section>

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
            className="flex w-full items-center justify-center bg-[#d6b36a] px-5 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[#11100f] hover:bg-[#ad8a4e]"
          >
            Book an appointment →
          </a>
        </div>
      </div>
    </main>
  );
}
