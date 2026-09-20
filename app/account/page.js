"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timeString) {
  if (!timeString) return "—";

  const [hours, minutes] = timeString.split(":");
  const date = new Date();

  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-ZA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatStatus(status) {
  if (!status) return "Pending";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "confirmed") {
    return "status confirmed";
  }

  if (normalized === "approved") {
    return "status approved";
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return "status cancelled";
  }

  if (normalized === "pending") {
    return "status pending";
  }

  return "status";
}

function paymentLabel(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "paid") {
    return "Deposit Paid";
  }

  if (normalized === "pending") {
    return "Deposit Pending";
  }

  if (normalized === "failed") {
    return "Payment Failed";
  }

  return formatStatus(status);
}

function isUnpaidBooking(appointment) {
  const paymentStatus = String(
    appointment?.payment_status || ""
  ).toLowerCase();

  return (
    paymentStatus !== "paid" &&
    !isCancelledBooking(appointment)
  );
}

function isCancelledBooking(appointment) {
  const status = String(
    appointment?.booking_status || ""
  ).toLowerCase();

  return status === "cancelled" || status === "canceled";
}

function isUpcomingBooking(appointment) {
  if (!appointment?.booking_date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appointmentDate = new Date(
    `${appointment.booking_date}T00:00:00`
  );

  return appointmentDate >= today;
}

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");

  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [successAppointmentId, setSuccessAppointmentId] = useState(null);

  useEffect(() => {
    loadAccount();
  }, []);

  async function loadAccount() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/account/login");
        return;
      }

      const currentUser = session.user;

      setUser(currentUser);

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

      if (profileError) {
        console.error("Profile error:", profileError);
      }

      setProfile(profileData || null);

      const { data: appointmentData, error: appointmentError } =
        await supabase
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
          .order("booking_date", { ascending: true })
          .order("start_time", { ascending: true });

      if (appointmentError) {
        throw appointmentError;
      }

      setAppointments(appointmentData || []);

      // Detect successful return from Yoco
      const params = new URLSearchParams(window.location.search);

      if (params.get("booking") === "success") {
        setBookingSuccess(true);

        const appointmentId = params.get("appointmentId");

        if (appointmentId) {
          setSuccessAppointmentId(appointmentId);
        }

        // Clean the URL without reloading the page
        window.history.replaceState(
          {},
          document.title,
          "/account"
        );
      }
    } catch (err) {
      console.error("Account loading error:", err);
      setError(
        err?.message ||
          "Unable to load your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function getAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Your session has expired. Please log in again.");
    }

    return session.access_token;
  }

  async function handlePayDeposit(appointment) {
    try {
      setActionLoading(`pay-${appointment.id}`);
      setActionError("");
      setMessage("");

      const accessToken = await getAccessToken();

      const response = await fetch("/api/account/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          appointmentId: appointment.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to start the deposit payment."
        );
      }

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      throw new Error(
        "No payment checkout link was returned."
      );
    } catch (err) {
      console.error("Payment error:", err);

      setActionError(
        err?.message ||
          "Unable to start payment. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelBooking(appointment) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel your appointment on ${formatDate(
        appointment.booking_date
      )} at ${formatTime(appointment.start_time)}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(`cancel-${appointment.id}`);
      setActionError("");
      setMessage("");

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
            "Unable to cancel this appointment."
        );
      }

      setMessage(
        "Your appointment has been cancelled successfully."
      );

      // Update the appointment immediately in the UI
      setAppointments((currentAppointments) =>
        currentAppointments.map((item) =>
          item.id === appointment.id
            ? {
                ...item,
                booking_status: "cancelled",
              }
            : item
        )
      );
    } catch (err) {
      console.error("Cancellation error:", err);

      setActionError(
        err?.message ||
          "Unable to cancel this appointment. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) {
    return (
      <main className="account-page">
        <div className="account-loading">
          <div className="loading-spinner" />
          <p>Loading your account...</p>
        </div>

        <style jsx>{`
          .account-page {
            min-height: 100vh;
            background: #111111;
            color: #f5f1ed;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .account-loading {
            text-align: center;
            color: #cfc7c1;
          }

          .loading-spinner {
            width: 38px;
            height: 38px;
            border: 3px solid rgba(255, 255, 255, 0.15);
            border-top-color: #d99a8b;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  const activeAppointments = appointments.filter(
    (appointment) => !isCancelledBooking(appointment)
  );

  const upcomingAppointments = activeAppointments.filter(
    (appointment) => isUpcomingBooking(appointment)
  );

  const historyAppointments = appointments.filter(
    (appointment) =>
      !isUpcomingBooking(appointment) ||
      isCancelledBooking(appointment)
  );

  const displayName =
    profile?.full_name ||
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Client";

  return (
    <main className="account-page">
      <div className="account-container">
        {/* HEADER */}
        <header className="account-header">
          <div>
            <p className="eyebrow">FREDDY NAILS</p>

            <h1>Client Account</h1>

            <p className="welcome-text">
              Welcome back, {displayName}.
            </p>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </header>

        {/* BOOKING SUCCESS */}
        {bookingSuccess && (
          <div className="success-banner">
            <div className="success-icon">✓</div>

            <div>
              <strong>Booking confirmed</strong>

              <p>
                Your booking has been received successfully.
                {successAppointmentId
                  ? " Your payment has also been processed."
                  : ""}
              </p>
            </div>
          </div>
        )}

        {/* GLOBAL MESSAGE */}
        {message && (
          <div className="message-banner">
            <span>✓</span>
            {message}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {actionError && (
          <div className="error-banner">
            {actionError}
          </div>
        )}

        {/* UPCOMING APPOINTMENTS */}
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="section-label">
                YOUR SCHEDULE
              </p>

              <h2>Upcoming Appointments</h2>
            </div>

            {upcomingAppointments.length > 0 && (
              <span className="appointment-count">
                {upcomingAppointments.length}{" "}
                {upcomingAppointments.length === 1
                  ? "appointment"
                  : "appointments"}
              </span>
            )}
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="empty-card">
              <div className="empty-icon">♡</div>

              <h3>No upcoming appointments</h3>

              <p>
                You don't have any upcoming appointments
                booked yet.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={() => router.push("/booking")}
              >
                Book an Appointment
              </button>
            </div>
          ) : (
            <div className="appointments-grid">
              {upcomingAppointments.map((appointment) => {
                const isPaying =
                  actionLoading ===
                  `pay-${appointment.id}`;

                const isCancelling =
                  actionLoading ===
                  `cancel-${appointment.id}`;

                return (
                  <article
                    className="appointment-card"
                    key={appointment.id}
                  >
                    <div className="appointment-top">
                      <div>
                        <p className="appointment-label">
                          APPOINTMENT
                        </p>

                        <h3>
                          {formatDate(
                            appointment.booking_date
                          )}
                        </h3>
                      </div>

                      <span
                        className={statusClass(
                          appointment.booking_status
                        )}
                      >
                        {formatStatus(
                          appointment.booking_status
                        )}
                      </span>
                    </div>

                    <div className="appointment-details">
                      <div className="detail">
                        <span className="detail-label">
                          TIME
                        </span>

                        <strong>
                          {formatTime(
                            appointment.start_time
                          )}
                          {appointment.end_time
                            ? ` – ${formatTime(
                                appointment.end_time
                              )}`
                            : ""}
                        </strong>
                      </div>

                      <div className="detail">
                        <span className="detail-label">
                          SERVICE
                        </span>

                        <strong>
                          {appointment.service_name ||
                            "Beauty appointment"}
                        </strong>
                      </div>

                      <div className="detail">
                        <span className="detail-label">
                          CLIENTS
                        </span>

                        <strong>
                          {appointment.client_count || 1}
                        </strong>
                      </div>

                      <div className="detail">
                        <span className="detail-label">
                          DEPOSIT
                        </span>

                        <strong>
                          R
                          {Number(
                            appointment.deposit_amount || 0
                          ).toFixed(2)}
                        </strong>
                      </div>
                    </div>

                    <div className="payment-row">
                      <span>Payment</span>

                      <strong
                        className={
                          String(
                            appointment.payment_status || ""
                          ).toLowerCase() === "paid"
                            ? "paid"
                            : "unpaid"
                        }
                      >
                        {paymentLabel(
                          appointment.payment_status
                        )}
                      </strong>
                    </div>

                    {appointment.notes && (
                      <div className="notes">
                        <span>Note</span>

                        <p>{appointment.notes}</p>
                      </div>
                    )}

                    {/* ACTIONS */}
                    <div className="appointment-actions">
                      {isUnpaidBooking(appointment) && (
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() =>
                            handlePayDeposit(appointment)
                          }
                          disabled={
                            actionLoading !== null
                          }
                        >
                          {isPaying
                            ? "Opening Payment..."
                            : `Pay Deposit · R${Number(
                                appointment.deposit_amount ||
                                  0
                              ).toFixed(2)}`}
                        </button>
                      )}

                      <button
                        type="button"
                        className="cancel-button"
                        onClick={() =>
                          handleCancelBooking(appointment)
                        }
                        disabled={
                          actionLoading !== null
                        }
                      >
                        {isCancelling
                          ? "Cancelling..."
                          : "Cancel Appointment"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* HISTORY */}
        <section className="section history-section">
          <div className="section-heading">
            <div>
              <p className="section-label">
                YOUR RECORD
              </p>

              <h2>Booking History</h2>
            </div>
          </div>

          {historyAppointments.length === 0 ? (
            <div className="empty-history">
              <p>
                Your previous bookings will appear here.
              </p>
            </div>
          ) : (
            <div className="history-list">
              {historyAppointments.map((appointment) => (
                <article
                  className="history-card"
                  key={appointment.id}
                >
                  <div className="history-date">
                    <strong>
                      {formatDate(
                        appointment.booking_date
                      )}
                    </strong>

                    <span>
                      {formatTime(
                        appointment.start_time
                      )}
                    </span>
                  </div>

                  <div className="history-service">
                    <strong>
                      {appointment.service_name ||
                        "Beauty appointment"}
                    </strong>

                    <span>
                      {appointment.client_count || 1}{" "}
                      {Number(
                        appointment.client_count || 1
                      ) === 1
                        ? "client"
                        : "clients"}
                    </span>
                  </div>

                  <div className="history-status">
                    <span
                      className={statusClass(
                        appointment.booking_status
                      )}
                    >
                      {formatStatus(
                        appointment.booking_status
                      )}
                    </span>

                    <small>
                      {paymentLabel(
                        appointment.payment_status
                      )}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* BOOK AGAIN */}
        <section className="book-again">
          <div>
            <p className="section-label">
              READY FOR YOUR NEXT SET?
            </p>

            <h2>Keep your nails looking perfect.</h2>

            <p>
              Book your next Freddy Nails appointment
              whenever you're ready.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() => router.push("/booking")}
          >
            Book Again
          </button>
        </section>
      </div>

      <style jsx>{`
        .account-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at top right,
              rgba(197, 130, 111, 0.08),
              transparent 35%
            ),
            #111111;
          color: #f5f1ed;
          padding: 50px 20px 80px;
        }

        .account-container {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }

        .account-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding-bottom: 35px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .eyebrow,
        .section-label,
        .appointment-label {
          margin: 0 0 8px;
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #c99788;
          font-weight: 600;
        }

        .account-header h1 {
          margin: 0;
          font-family: Georgia, serif;
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 400;
        }

        .welcome-text {
          margin: 10px 0 0;
          color: #aaa19b;
          font-size: 15px;
        }

        .logout-button {
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: transparent;
          color: #f5f1ed;
          padding: 11px 20px;
          border-radius: 999px;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .logout-button:hover {
          border-color: #c99788;
          color: #c99788;
        }

        .success-banner,
        .message-banner,
        .error-banner {
          margin-top: 25px;
          border-radius: 14px;
          padding: 16px 18px;
          display: flex;
          gap: 13px;
          align-items: flex-start;
        }

        .success-banner {
          background: rgba(96, 165, 130, 0.1);
          border: 1px solid rgba(96, 165, 130, 0.3);
        }

        .success-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(96, 165, 130, 0.2);
        }

        .success-banner strong {
          display: block;
          margin-bottom: 4px;
        }

        .success-banner p {
          margin: 0;
          color: #b9b1ab;
          font-size: 14px;
        }

        .message-banner {
          background: rgba(217, 154, 139, 0.08);
          border: 1px solid rgba(217, 154, 139, 0.25);
          color: #ead6cf;
        }

        .error-banner {
          background: rgba(180, 70, 70, 0.1);
          border: 1px solid rgba(220, 100, 100, 0.25);
          color: #efb6b6;
        }

        .section {
          margin-top: 50px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 22px;
        }

        .section-heading h2 {
          margin: 0;
          font-family: Georgia, serif;
          font-size: 28px;
          font-weight: 400;
        }

        .appointment-count {
          color: #a9a09a;
          font-size: 13px;
        }

        .appointments-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(300px, 1fr)
          );
          gap: 18px;
        }

        .appointment-card {
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.055),
            rgba(255, 255, 255, 0.025)
          );
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 25px;
        }

        .appointment-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .appointment-top h3 {
          margin: 0;
          font-family: Georgia, serif;
          font-size: 20px;
          font-weight: 400;
          line-height: 1.35;
        }

        .status {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 10px;
          letter-spacing: 0.05em;
          background: rgba(255, 255, 255, 0.08);
          color: #d5cdc7;
        }

        .status.confirmed {
          background: rgba(96, 165, 130, 0.13);
          color: #a9d5ba;
        }

        .status.approved {
          background: rgba(217, 154, 139, 0.13);
          color: #e8b9ac;
        }

        .status.pending {
          background: rgba(210, 180, 100, 0.13);
          color: #dec88e;
        }

        .status.cancelled {
          background: rgba(180, 100, 100, 0.12);
          color: #dda7a7;
        }

        .appointment-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px 15px;
          padding: 22px 0;
        }

        .detail {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .detail-label {
          font-size: 9px;
          letter-spacing: 0.15em;
          color: #827b76;
        }

        .detail strong {
          font-size: 13px;
          line-height: 1.4;
          color: #e9e3df;
          font-weight: 500;
        }

        .payment-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          padding-top: 15px;
          font-size: 12px;
          color: #8e8782;
        }

        .payment-row strong.paid {
          color: #a9d5ba;
        }

        .payment-row strong.unpaid {
          color: #e0bd84;
        }

        .notes {
          margin-top: 18px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.035);
          border-radius: 10px;
        }

        .notes span {
          font-size: 9px;
          letter-spacing: 0.15em;
          color: #827b76;
        }

        .notes p {
          margin: 5px 0 0;
          font-size: 12px;
          color: #b7afa9;
          line-height: 1.5;
        }

        .appointment-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 22px;
        }

        .primary-button,
        .cancel-button {
          width: 100%;
          border-radius: 999px;
          padding: 13px 18px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .primary-button {
          border: 1px solid #c99788;
          background: #c99788;
          color: #171313;
        }

        .primary-button:hover:not(:disabled) {
          transform: translateY(-1px);
          background: #d9aa9c;
        }

        .cancel-button {
          border: 1px solid rgba(220, 150, 150, 0.3);
          background: transparent;
          color: #dca8a8;
        }

        .cancel-button:hover:not(:disabled) {
          border-color: rgba(220, 150, 150, 0.6);
          background: rgba(220, 150, 150, 0.07);
        }

        .primary-button:disabled,
        .cancel-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .empty-card {
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 45px 25px;
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
        }

        .empty-icon {
          font-size: 30px;
          color: #c99788;
          margin-bottom: 10px;
        }

        .empty-card h3 {
          margin: 0 0 8px;
          font-family: Georgia, serif;
          font-size: 22px;
          font-weight: 400;
        }

        .empty-card p {
          margin: 0 auto 22px;
          max-width: 400px;
          color: #908984;
          font-size: 14px;
        }

        .empty-card .primary-button {
          width: auto;
          min-width: 190px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .history-card {
          display: grid;
          grid-template-columns: 1.4fr 1fr 0.8fr;
          gap: 20px;
          align-items: center;
          padding: 18px 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.025);
        }

        .history-date,
        .history-service,
        .history-status {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .history-date strong,
        .history-service strong {
          font-size: 13px;
          font-weight: 500;
        }

        .history-date span,
        .history-service span,
        .history-status small {
          color: #817a75;
          font-size: 11px;
        }

        .history-status {
          align-items: flex-end;
        }

        .empty-history {
          padding: 25px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.025);
          color: #817a75;
          font-size: 13px;
        }

        .book-again {
          margin-top: 55px;
          padding: 30px;
          border-radius: 20px;
          border: 1px solid rgba(217, 154, 139, 0.2);
          background:
            linear-gradient(
              135deg,
              rgba(217, 154, 139, 0.08),
              rgba(255, 255, 255, 0.025)
            );
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
        }

        .book-again h2 {
          margin: 0;
          font-family: Georgia, serif;
          font-size: 26px;
          font-weight: 400;
        }

        .book-again p:last-child {
          margin: 8px 0 0;
          color: #918984;
          font-size: 13px;
        }

        .book-again .primary-button {
          width: auto;
          min-width: 150px;
        }

        @media (max-width: 700px) {
          .account-page {
            padding: 30px 15px 60px;
          }

          .account-header {
            flex-direction: column;
          }

          .logout-button {
            align-self: flex-start;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
          }

          .appointments-grid {
            grid-template-columns: 1fr;
          }

          .appointment-card {
            padding: 20px;
          }

          .appointment-details {
            gap: 18px 10px;
          }

          .history-card {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .history-status {
            align-items: flex-start;
          }

          .book-again {
            flex-direction: column;
            align-items: flex-start;
          }

          .book-again .primary-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
