"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReminderSettings from "@/components/ReminderSettings";
import AvatarUploader from "@/components/AvatarUploader";
import QuickActions from "@/components/QuickActions";
import RewardsLadder from "@/components/RewardsLadder";
import MySets from "@/components/MySets";
import ReviewReward from "@/components/ReviewReward";

const CHOSEN_PROMO_KEY = "freddynails_chosen_promo";

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

function formatShortDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
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
  if (normalized === "confirmed") return "status confirmed";
  if (normalized === "approved") return "status approved";
  if (normalized === "cancelled" || normalized === "canceled")
    return "status cancelled";
  if (normalized === "pending") return "status pending";
  return "status";
}

function paymentLabel(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "paid") return "Deposit Paid";
  if (normalized === "pending") return "Deposit Pending";
  if (normalized === "failed") return "Payment Failed";
  return formatStatus(status);
}

function isUnpaidBooking(appointment) {
  const paymentStatus = String(
    appointment?.payment_status || ""
  ).toLowerCase();
  return paymentStatus !== "paid" && !isCancelledBooking(appointment);
}

function isCancelledBooking(appointment) {
  const status = String(
    appointment?.booking_status || ""
  ).toLowerCase();
  return status === "cancelled" || status === "canceled";
}

function isSuccessfulVisit(appointment) {
  if (isCancelledBooking(appointment)) return false;
  const payment = String(
    appointment?.payment_status || ""
  ).toLowerCase();
  const booking = String(
    appointment?.booking_status || ""
  ).toLowerCase();
  if (payment === "paid" || payment === "deposit_paid") return true;
  if (booking === "approved" || booking === "confirmed") return true;
  return false;
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

function getInitials(name) {
  if (!name) return "FN";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "FN";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function daysUntil(dateString) {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateString}T00:00:00`);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function getLoyaltyTier(visitCount) {
  if (visitCount >= 6) {
    return {
      id: "elite",
      label: "Elite",
      sub: "Gold Member",
      next: null,
      progress: 1,
      remaining: 0,
    };
  }
  if (visitCount >= 3) {
    return {
      id: "vip",
      label: "VIP",
      sub: "Valued Client",
      next: "Elite",
      progress: (visitCount - 3) / 3,
      remaining: 6 - visitCount,
    };
  }
  if (visitCount >= 1) {
    return {
      id: "regular",
      label: "Regular",
      sub: "Returning Client",
      next: "VIP",
      progress: (visitCount - 1) / 2,
      remaining: 3 - visitCount,
    };
  }
  return {
    id: "new",
    label: "New Client",
    sub: "Welcome",
    next: "Regular",
    progress: 0,
    remaining: 1,
  };
}

function formatDiscount(offer) {
  if (!offer) return "";
  const type = String(offer.discountType || "").toLowerCase();
  const value = Number(offer.discountValue || 0);
  if (type === "percent" || type === "percentage") {
    return `${value}% OFF`;
  }
  if (type === "fixed" || type === "amount" || type === "rand") {
    return `R${value} OFF`;
  }
  if (value) return String(offer.discountValue);
  return "Special";
}

function isBirthdayMonth(dateOfBirth) {
  if (!dateOfBirth) return false;
  const parts = String(dateOfBirth).slice(0, 10).split("-");
  if (parts.length !== 3) return false;
  const birthMonth = Number(parts[1]);
  const currentMonth = new Date().getMonth() + 1;
  return birthMonth === currentMonth;
}

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");

  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [successAppointmentId, setSuccessAppointmentId] = useState(null);

  // Profile edit
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
  });

  // Offer copy feedback
  const [copiedCode, setCopiedCode] = useState("");

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

      const { data: profileData, error: profileError } = await supabase
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

      // Personalized offers (non-blocking)
      loadOffers(session.access_token);

      const params = new URLSearchParams(window.location.search);
      if (params.get("booking") === "success") {
        setBookingSuccess(true);
        const appointmentId = params.get("appointmentId");
        if (appointmentId) {
          setSuccessAppointmentId(appointmentId);
        }
        window.history.replaceState({}, document.title, "/account");
      }
    } catch (err) {
      console.error("Account loading error:", err);
      setError(
        err?.message || "Unable to load your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadOffers(accessToken) {
    try {
      setOffersLoading(true);
      let token = accessToken;
      if (!token) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        token = session?.access_token;
      }
      if (!token) return;

      const response = await fetch("/api/account/offers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data?.success && Array.isArray(data.offers)) {
        setOffers(data.offers);
      }
    } catch (err) {
      console.error("Offers load error:", err);
    } finally {
      setOffersLoading(false);
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
        body: JSON.stringify({ appointmentId: appointment.id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to start the deposit payment."
        );
      }
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      throw new Error("No payment checkout link was returned.");
    } catch (err) {
      console.error("Payment error:", err);
      setActionError(
        err?.message || "Unable to start payment. Please try again."
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
    if (!confirmed) return;

    try {
      setActionLoading(`cancel-${appointment.id}`);
      setActionError("");
      setMessage("");

      const accessToken = await getAccessToken();
      const response = await fetch("/api/account/cancel-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ appointmentId: appointment.id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to cancel this appointment."
        );
      }

      setMessage("Your appointment has been cancelled successfully.");
      setAppointments((current) =>
        current.map((item) =>
          item.id === appointment.id
            ? { ...item, booking_status: "cancelled" }
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

  function openEditProfile() {
    setEditError("");
    setEditForm({
      full_name:
        profile?.full_name ||
        profile?.name ||
        user?.user_metadata?.full_name ||
        "",
      phone: profile?.phone || user?.user_metadata?.phone || "",
      date_of_birth: profile?.date_of_birth
        ? String(profile.date_of_birth).slice(0, 10)
        : "",
    });
    setEditOpen(true);
  }

  function closeEditProfile() {
    if (editSaving) return;
    setEditOpen(false);
    setEditError("");
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!user?.id) return;

    const name = editForm.full_name.trim();
    if (!name) {
      setEditError("Please enter your full name.");
      return;
    }

    try {
      setEditSaving(true);
      setEditError("");

      const payload = {
        full_name: name,
        phone: editForm.phone.trim() || null,
        date_of_birth: editForm.date_of_birth || null,
      };

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id)
        .select("*")
        .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      // Also refresh auth metadata for name consistency
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: name,
            phone: editForm.phone.trim() || null,
          },
        });
      } catch {
        // Non-critical if metadata update fails
      }

      setProfile((prev) => ({
        ...(prev || {}),
        ...(data || payload),
        id: user.id,
      }));

      setMessage("Your profile has been updated.");
      setEditOpen(false);

      // Reload offers in case birthday eligibility changed
      loadOffers();
    } catch (err) {
      console.error("Profile update error:", err);
      setEditError(
        err?.message ||
          "Unable to save your profile. Please try again."
      );
    } finally {
      setEditSaving(false);
    }
  }

  function handleUseOffer(offer) {
    const code = offer?.code;
    if (!code) return;

    try {
      navigator.clipboard.writeText(code);
    } catch {
      // Clipboard may be unavailable
    }

    try {
      window.localStorage.setItem(
        CHOSEN_PROMO_KEY,
        JSON.stringify({ code, savedAt: Date.now() })
      );
    } catch {
      // Storage may be unavailable
    }

    setCopiedCode(code);
    window.setTimeout(() => {
      router.push("/account/book");
    }, 500);
  }

  if (loading) {
    return (
      <main className="account-page">
        <div className="account-loading">
          <div className="loading-ring">
            <div className="loading-spinner" />
          </div>
          <p className="loading-label">Loading your account</p>
          <p className="loading-sub">Just a moment…</p>
        </div>

        <style jsx>{`
          .account-page {
            min-height: 100vh;
            background: #11100f;
            color: #f4eee6;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .account-loading {
            text-align: center;
          }
          .loading-ring {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
          }
          .loading-spinner {
            width: 42px;
            height: 42px;
            border: 2px solid rgba(214, 179, 106, 0.15);
            border-top-color: #d6b36a;
            border-radius: 50%;
            animation: spin 0.75s linear infinite;
          }
          .loading-label {
            margin: 0;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 18px;
            color: #f4eee6;
          }
          .loading-sub {
            margin: 6px 0 0;
            font-size: 13px;
            color: #9a9088;
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
    (a) => !isCancelledBooking(a)
  );
  const upcomingAppointments = activeAppointments.filter(
    isUpcomingBooking
  );
  const historyAppointments = appointments.filter(
    (a) => !isUpcomingBooking(a) || isCancelledBooking(a)
  );

  const displayName =
    profile?.full_name ||
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Client";

  const displayEmail = user?.email || profile?.email || "";
  const displayPhone =
    profile?.phone || user?.user_metadata?.phone || "";
  const initials = getInitials(displayName);
  const nextAppointment = upcomingAppointments[0] || null;
  const daysToNext = nextAppointment
    ? daysUntil(nextAppointment.booking_date)
    : null;

  const successfulVisits = appointments.filter(isSuccessfulVisit).length;
  const totalVisits = successfulVisits;
  const unpaidCount = upcomingAppointments.filter(isUnpaidBooking).length;
  const loyalty = getLoyaltyTier(successfulVisits);
  const birthdayMonth = isBirthdayMonth(profile?.date_of_birth);
  const missingDob = !profile?.date_of_birth;

  return (
    <main className="account-page">
      <div className="bg-glow bg-glow-1" aria-hidden="true" />
      <div className="bg-glow bg-glow-2" aria-hidden="true" />

      <div className="account-container">
        {/* ── PROFILE HERO ── */}
        <header className="profile-hero">
          <div className="profile-left">
            <AvatarUploader user={user} initials={initials} tier={loyalty.id} />

            <div className="profile-text">
              <div className="eyebrow-row">
                <p className="eyebrow">FREDDY NAILS · CLIENT PORTAL</p>
                <span className={`loyalty-badge tier-${loyalty.id}`}>
                  <span className="badge-dot" />
                  {loyalty.label}
                </span>
              </div>
              <h1>
                Welcome back,{" "}
                <span className="name-accent">{displayName}</span>
              </h1>
              <div className="profile-meta">
                {displayEmail && (
                  <span className="meta-item">{displayEmail}</span>
                )}
                {displayPhone && (
                  <span className="meta-item">{displayPhone}</span>
                )}
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={openEditProfile}
            >
              Edit Profile
            </button>
            <button
              type="button"
              className="ghost-button book-ghost"
              onClick={() => router.push("/account/book")}
            >
              Book Appointment
            </button>
            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        </header>

        <QuickActions appointments={appointments} />

        {/* ── LOYALTY CARD ── */}
        <section className="loyalty-card">
          <div className="loyalty-main">
            <div className="loyalty-tier-block">
              <p className="section-label">LOYALTY STATUS</p>
              <h2 className={`tier-title tier-${loyalty.id}`}>
                {loyalty.label}
              </h2>
              <p className="tier-sub">{loyalty.sub}</p>
            </div>

            <div className="loyalty-stats">
              <div className="loyalty-stat">
                <strong>{successfulVisits}</strong>
                <span>
                  {successfulVisits === 1 ? "visit" : "visits"} completed
                </span>
              </div>
              {loyalty.next && (
                <div className="loyalty-stat">
                  <strong>{loyalty.remaining}</strong>
                  <span>
                    more to reach {loyalty.next}
                  </span>
                </div>
              )}
            </div>
          </div>

          {loyalty.next && (
            <div className="loyalty-progress">
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(8, loyalty.progress * 100)
                    )}%`,
                  }}
                />
              </div>
              <p className="progress-hint">
                Book {loyalty.remaining} more{" "}
                {loyalty.remaining === 1 ? "visit" : "visits"} to unlock{" "}
                <strong>{loyalty.next}</strong>
              </p>
            </div>
          )}

          {loyalty.id === "elite" && (
            <p className="elite-note">
              You&apos;re at the top tier — thank you for being a loyal
              Freddy Nails client.
            </p>
          )}
        </section>

        <RewardsLadder visits={successfulVisits} />

        {/* ── QUICK STATS ── */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-label">Upcoming</span>
            <strong className="stat-value">
              {upcomingAppointments.length}
            </strong>
            <span className="stat-hint">
              {upcomingAppointments.length === 1
                ? "appointment"
                : "appointments"}
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Next visit</span>
            <strong className="stat-value">
              {daysToNext === null
                ? "—"
                : daysToNext === 0
                  ? "Today"
                  : daysToNext === 1
                    ? "Tomorrow"
                    : `${daysToNext}d`}
            </strong>
            <span className="stat-hint">
              {nextAppointment
                ? formatShortDate(nextAppointment.booking_date)
                : "No booking yet"}
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Total visits</span>
            <strong className="stat-value">{totalVisits}</strong>
            <span className="stat-hint">all time</span>
          </div>

          {unpaidCount > 0 && (
            <div className="stat-card stat-alert">
              <span className="stat-label">Action needed</span>
              <strong className="stat-value">{unpaidCount}</strong>
              <span className="stat-hint">
                {unpaidCount === 1 ? "deposit pending" : "deposits pending"}
              </span>
            </div>
          )}
        </div>

        {/* BOOKING SUCCESS */}
        {bookingSuccess && (
          <div className="banner success-banner">
            <div className="banner-icon success-icon">✓</div>
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

        {message && (
          <div className="banner message-banner">
            <span className="banner-icon">✓</span>
            <span>{message}</span>
          </div>
        )}

        {error && <div className="banner error-banner">{error}</div>}
        {actionError && (
          <div className="banner error-banner">{actionError}</div>
        )}

        {/* Birthday / DOB nudge */}
        {birthdayMonth && (
          <div className="banner birthday-banner">
            <span className="banner-icon">🎂</span>
            <div>
              <strong>Happy birthday month!</strong>
              <p>
                Check your offers below — you may have a birthday special
                waiting.
              </p>
            </div>
          </div>
        )}

        {missingDob && !birthdayMonth && (
          <div className="banner tip-banner">
            <span className="banner-icon">✦</span>
            <div>
              <strong>Unlock birthday offers</strong>
              <p>
                Add your date of birth in{" "}
                <button
                  type="button"
                  className="inline-link"
                  onClick={openEditProfile}
                >
                  Edit Profile
                </button>{" "}
                to receive birthday specials.
              </p>
            </div>
          </div>
        )}

        {/* ── OFFERS STRIP ── */}
        <section className="section offers-section">
          <div className="section-heading">
            <div>
              <p className="section-label">JUST FOR YOU</p>
              <h2>Your Offers</h2>
            </div>
            {!offersLoading && offers.length > 0 && (
              <span className="appointment-count">
                {offers.length} available
              </span>
            )}
          </div>

          {offersLoading ? (
            <div className="offers-loading">Loading your offers…</div>
          ) : offers.length === 0 ? (
            <div className="empty-offers">
              <p>
                No personalised offers right now. Check back soon, or book
                your next appointment to keep building loyalty.
              </p>
            </div>
          ) : (
            <div className="offers-strip">
              {offers.map((offer) => {
                const isCopied = copiedCode === offer.code;
                return (
                  <article className="offer-card" key={offer.id || offer.code}>
                    <div className="offer-top">
                      <span className="offer-discount">
                        {formatDiscount(offer)}
                      </span>
                      {offer.birthdayOffer && (
                        <span className="offer-tag">Birthday</span>
                      )}
                      {offer.newClientsOnly && (
                        <span className="offer-tag">New client</span>
                      )}
                      {offer.referralOffer && (
                        <span className="offer-tag">Referral</span>
                      )}
                    </div>

                    <p className="offer-desc">
                      {offer.description ||
                        `Use code ${offer.code} on your next booking.`}
                    </p>

                    <div className="offer-code-row">
                      <code className="offer-code">{offer.code}</code>
                      <button
                        type="button"
                        className="offer-use-btn"
                        onClick={() => handleUseOffer(offer)}
                      >
                        {isCopied ? "Applied ✓" : "Use offer"}
                      </button>
                    </div>

                    {offer.minimumSpend != null &&
                      Number(offer.minimumSpend) > 0 && (
                        <p className="offer-min">
                          Min. spend R{Number(offer.minimumSpend).toFixed(0)}
                        </p>
                      )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ── UPCOMING APPOINTMENTS ── */}
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="section-label">YOUR SCHEDULE</p>
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
              <div className="empty-visual">
                <div className="empty-ring">
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
              </div>
              <h3>No upcoming appointments</h3>
              <p>
                Your calendar is free. Book a slot and treat yourself to
                perfectly polished nails.
              </p>
              <button
                type="button"
                className="primary-button"
                onClick={() => router.push("/account/book")}
              >
                Book an Appointment
              </button>
            </div>
          ) : (
            <div className="appointments-grid">
              {upcomingAppointments.map((appointment) => {
                const isPaying =
                  actionLoading === `pay-${appointment.id}`;
                const isCancelling =
                  actionLoading === `cancel-${appointment.id}`;
                const days = daysUntil(appointment.booking_date);

                return (
                  <article
                    className="appointment-card"
                    key={appointment.id}
                  >
                    <div className="card-accent" aria-hidden="true" />
                    <div className="appointment-top">
                      <div>
                        <p className="appointment-label">
                          {days === 0
                            ? "TODAY"
                            : days === 1
                              ? "TOMORROW"
                              : days !== null && days <= 7
                                ? `IN ${days} DAYS`
                                : "APPOINTMENT"}
                        </p>
                        <h3>{formatDate(appointment.booking_date)}</h3>
                      </div>
                      <span
                        className={statusClass(appointment.booking_status)}
                      >
                        {formatStatus(appointment.booking_status)}
                      </span>
                    </div>

                    <div className="appointment-details">
                      <div className="detail">
                        <span className="detail-label">TIME</span>
                        <strong>
                          {formatTime(appointment.start_time)}
                          {appointment.end_time
                            ? ` – ${formatTime(appointment.end_time)}`
                            : ""}
                        </strong>
                      </div>
                      <div className="detail">
                        <span className="detail-label">SERVICE</span>
                        <strong>
                          {appointment.service_name || "Beauty appointment"}
                        </strong>
                      </div>
                      <div className="detail">
                        <span className="detail-label">CLIENTS</span>
                        <strong>{appointment.client_count || 1}</strong>
                      </div>
                      <div className="detail">
                        <span className="detail-label">DEPOSIT</span>
                        <strong>
                          R
                          {Number(appointment.deposit_amount || 0).toFixed(2)}
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
                        {paymentLabel(appointment.payment_status)}
                      </strong>
                    </div>

                    {appointment.notes && (
                      <div className="notes">
                        <span>Note</span>
                        <p>{appointment.notes}</p>
                      </div>
                    )}

                    <div className="appointment-actions">
                      {isUnpaidBooking(appointment) && (
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => handlePayDeposit(appointment)}
                          disabled={actionLoading !== null}
                        >
                          {isPaying
                            ? "Opening Payment..."
                            : `Pay Deposit · R${Number(
                                appointment.deposit_amount || 0
                              ).toFixed(2)}`}
                        </button>
                      )}
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={() => handleCancelBooking(appointment)}
                        disabled={actionLoading !== null}
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

        {/* ── HISTORY ── */}
        <section className="section history-section">
          <div className="section-heading">
            <div>
              <p className="section-label">YOUR RECORD</p>
              <h2>Booking History</h2>
            </div>
          </div>

          {historyAppointments.length === 0 ? (
            <div className="empty-history">
              <p>
                Your previous bookings will appear here once you have
                visited us.
              </p>
            </div>
          ) : (
            <div className="history-list">
              {historyAppointments.map((appointment) => (
                <article className="history-card" key={appointment.id}>
                  <div className="history-date">
                    <strong>
                      {formatShortDate(appointment.booking_date)}
                    </strong>
                    <span>{formatTime(appointment.start_time)}</span>
                  </div>
                  <div className="history-service">
                    <strong>
                      {appointment.service_name || "Beauty appointment"}
                    </strong>
                    <span>
                      {appointment.client_count || 1}{" "}
                      {Number(appointment.client_count || 1) === 1
                        ? "client"
                        : "clients"}
                    </span>
                  </div>
                  <div className="history-status">
                    <span
                      className={statusClass(appointment.booking_status)}
                    >
                      {formatStatus(appointment.booking_status)}
                    </span>
                    <small>
                      {paymentLabel(appointment.payment_status)}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <MySets user={user} />

        {/* ── BOOK AGAIN CTA ── */}
        <section className="book-again">
          <div className="book-again-content">
            <p className="section-label">READY FOR YOUR NEXT SET?</p>
            <h2>Keep your nails looking perfect.</h2>
            <p>
              Book your next Freddy Nails appointment whenever you&apos;re
              ready — same great care, every time.
            </p>
          </div>
          <button
            type="button"
            className="primary-button book-cta"
            onClick={() => router.push("/account/book")}
          >
            Book Again
          </button>
        </section>

        <ReviewReward />

        <ReminderSettings />
      </div>

      {/* ── PROFILE EDIT MODAL ── */}
      {editOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={closeEditProfile}
        >
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="section-label">YOUR DETAILS</p>
                <h2 id="edit-profile-title">Edit Profile</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeEditProfile}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="edit-form">
              <label className="field">
                <span>Full name</span>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      full_name: e.target.value,
                    }))
                  }
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                />
              </label>

              <label className="field">
                <span>Phone</span>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="e.g. 071 088 8897"
                  autoComplete="tel"
                />
              </label>

              <label className="field">
                <span>Date of birth</span>
                <input
                  type="date"
                  value={editForm.date_of_birth}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      date_of_birth: e.target.value,
                    }))
                  }
                />
                <small className="field-hint">
                  Used for birthday offers only. Never shared publicly.
                </small>
              </label>

              {editError && (
                <div className="edit-error">{editError}</div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button modal-cancel"
                  onClick={closeEditProfile}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button modal-save"
                  disabled={editSaving}
                >
                  {editSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .account-page {
          position: relative;
          min-height: 100vh;
          background: #11100f;
          color: #f4eee6;
          padding: 48px 20px 90px;
          overflow-x: hidden;
        }

        .bg-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(80px);
          opacity: 0.55;
        }

        .bg-glow-1 {
          top: -120px;
          right: -80px;
          width: 420px;
          height: 420px;
          background: radial-gradient(
            circle,
            rgba(214, 179, 106, 0.14),
            transparent 70%
          );
        }

        .bg-glow-2 {
          bottom: 10%;
          left: -100px;
          width: 360px;
          height: 360px;
          background: radial-gradient(
            circle,
            rgba(173, 138, 78, 0.08),
            transparent 70%
          );
        }

        .account-container {
          position: relative;
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
        }

        /* ── Profile hero ── */
        .profile-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding-bottom: 32px;
          border-bottom: 1px solid rgba(214, 179, 106, 0.12);
        }

        .profile-left {
          display: flex;
          align-items: center;
          gap: 20px;
          min-width: 0;
        }

        .avatar {
          flex-shrink: 0;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(
            145deg,
            rgba(214, 179, 106, 0.25),
            rgba(173, 138, 78, 0.12)
          );
          border: 1.5px solid rgba(214, 179, 106, 0.45);
          box-shadow:
            0 0 0 4px rgba(214, 179, 106, 0.06),
            0 8px 24px rgba(0, 0, 0, 0.35);
        }

        .avatar.tier-elite {
          border-color: #d6b36a;
          box-shadow:
            0 0 0 4px rgba(214, 179, 106, 0.12),
            0 0 28px rgba(214, 179, 106, 0.25);
        }

        .avatar.tier-vip {
          border-color: rgba(214, 179, 106, 0.7);
        }

        .avatar span {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 20px;
          font-weight: 500;
          letter-spacing: 0.04em;
          color: #d6b36a;
        }

        .profile-text {
          min-width: 0;
        }

        .eyebrow-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }

        .eyebrow,
        .section-label,
        .appointment-label {
          margin: 0;
          font-size: 10px;
          letter-spacing: 0.22em;
          color: #d6b36a;
          font-weight: 600;
          text-transform: uppercase;
        }

        .loyalty-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: rgba(214, 179, 106, 0.12);
          color: #d6b36a;
          border: 1px solid rgba(214, 179, 106, 0.25);
        }

        .loyalty-badge.tier-new {
          background: rgba(255, 255, 255, 0.06);
          color: #c9c0b6;
          border-color: rgba(255, 255, 255, 0.1);
        }

        .loyalty-badge.tier-regular {
          background: rgba(150, 180, 200, 0.12);
          color: #a8c4d4;
          border-color: rgba(150, 180, 200, 0.25);
        }

        .loyalty-badge.tier-vip {
          background: rgba(214, 179, 106, 0.14);
          color: #e0c98a;
          border-color: rgba(214, 179, 106, 0.35);
        }

        .loyalty-badge.tier-elite {
          background: linear-gradient(
            135deg,
            rgba(214, 179, 106, 0.25),
            rgba(173, 138, 78, 0.15)
          );
          color: #f0d78c;
          border-color: rgba(214, 179, 106, 0.5);
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .profile-hero h1 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(26px, 4.5vw, 38px);
          font-weight: 400;
          line-height: 1.2;
          color: #f4eee6;
        }

        .name-accent {
          color: #d6b36a;
        }

        .profile-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 16px;
          margin-top: 8px;
        }

        .meta-item {
          font-size: 13px;
          color: #9a9088;
        }

        .profile-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          flex-wrap: wrap;
        }

        .ghost-button,
        .logout-button {
          border-radius: 999px;
          padding: 11px 18px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s ease;
          white-space: nowrap;
        }

        .ghost-button {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: transparent;
          color: #c9c0b6;
        }

        .ghost-button:hover {
          border-color: rgba(214, 179, 106, 0.4);
          color: #d6b36a;
        }

        .ghost-button.book-ghost {
          border-color: rgba(214, 179, 106, 0.45);
          background: rgba(214, 179, 106, 0.08);
          color: #d6b36a;
        }

        .ghost-button.book-ghost:hover {
          background: rgba(214, 179, 106, 0.16);
          border-color: #d6b36a;
        }

        .logout-button {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: transparent;
          color: #c9c0b6;
        }

        .logout-button:hover {
          border-color: rgba(214, 179, 106, 0.35);
          color: #d6b36a;
        }

        /* ── Loyalty card ── */
        .loyalty-card {
          margin-top: 28px;
          padding: 24px 26px;
          border-radius: 20px;
          border: 1px solid rgba(214, 179, 106, 0.18);
          background: linear-gradient(
            145deg,
            rgba(214, 179, 106, 0.09),
            rgba(255, 255, 255, 0.02)
          );
        }

        .loyalty-main {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }

        .tier-title {
          margin: 4px 0 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 32px;
          font-weight: 400;
          color: #d6b36a;
        }

        .tier-title.tier-new {
          color: #c9c0b6;
        }

        .tier-title.tier-regular {
          color: #a8c4d4;
        }

        .tier-title.tier-vip,
        .tier-title.tier-elite {
          color: #e8d48a;
        }

        .tier-sub {
          margin: 4px 0 0;
          font-size: 13px;
          color: #9a9088;
        }

        .loyalty-stats {
          display: flex;
          gap: 28px;
        }

        .loyalty-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: right;
        }

        .loyalty-stat strong {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 26px;
          font-weight: 400;
          color: #f4eee6;
        }

        .loyalty-stat span {
          font-size: 12px;
          color: #7a736c;
        }

        .loyalty-progress {
          margin-top: 20px;
        }

        .progress-track {
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #ad8a4e, #d6b36a);
          transition: width 0.4s ease;
        }

        .progress-hint {
          margin: 10px 0 0;
          font-size: 12px;
          color: #9a9088;
        }

        .progress-hint strong {
          color: #d6b36a;
          font-weight: 600;
        }

        .elite-note {
          margin: 16px 0 0;
          font-size: 13px;
          color: #c9b896;
        }

        /* ── Stats ── */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .stat-card {
          background: linear-gradient(
            160deg,
            rgba(255, 255, 255, 0.04),
            rgba(255, 255, 255, 0.015)
          );
          border: 1px solid rgba(214, 179, 106, 0.1);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-card.stat-alert {
          border-color: rgba(224, 189, 132, 0.35);
          background: linear-gradient(
            160deg,
            rgba(214, 179, 106, 0.1),
            rgba(255, 255, 255, 0.02)
          );
        }

        .stat-label {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #8a8178;
          font-weight: 600;
        }

        .stat-value {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 28px;
          font-weight: 400;
          color: #f4eee6;
          line-height: 1.15;
        }

        .stat-alert .stat-value {
          color: #e0bd84;
        }

        .stat-hint {
          font-size: 12px;
          color: #7a736c;
        }

        /* ── Banners ── */
        .banner {
          margin-top: 18px;
          border-radius: 14px;
          padding: 15px 18px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          font-size: 14px;
        }

        .success-banner {
          background: rgba(96, 165, 130, 0.1);
          border: 1px solid rgba(96, 165, 130, 0.28);
        }

        .banner-icon {
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 13px;
        }

        .success-icon {
          background: rgba(96, 165, 130, 0.22);
          color: #a9d5ba;
        }

        .success-banner strong {
          display: block;
          margin-bottom: 3px;
        }

        .success-banner p {
          margin: 0;
          color: #b9b1ab;
          font-size: 13px;
        }

        .message-banner {
          background: rgba(214, 179, 106, 0.08);
          border: 1px solid rgba(214, 179, 106, 0.22);
          color: #e8d9b8;
        }

        .error-banner {
          background: rgba(180, 70, 70, 0.1);
          border: 1px solid rgba(220, 100, 100, 0.25);
          color: #efb6b6;
        }

        .birthday-banner {
          background: rgba(214, 179, 106, 0.1);
          border: 1px solid rgba(214, 179, 106, 0.28);
          color: #f0e4c8;
        }

        .birthday-banner p {
          margin: 3px 0 0;
          font-size: 13px;
          color: #c9b896;
        }

        .tip-banner {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #d5cdc5;
        }

        .tip-banner p {
          margin: 3px 0 0;
          font-size: 13px;
          color: #9a9088;
        }

        .inline-link {
          background: none;
          border: none;
          padding: 0;
          color: #d6b36a;
          font: inherit;
          text-decoration: underline;
          cursor: pointer;
        }

        /* ── Sections ── */
        .section {
          margin-top: 44px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 18px;
        }

        .section-heading h2 {
          margin: 4px 0 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(24px, 3.5vw, 30px);
          font-weight: 400;
          color: #f4eee6;
        }

        .appointment-count {
          color: #9a9088;
          font-size: 13px;
        }

        /* ── Offers strip ── */
        .offers-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }

        .offer-card {
          background: linear-gradient(
            155deg,
            rgba(214, 179, 106, 0.08),
            rgba(255, 255, 255, 0.02)
          );
          border: 1px solid rgba(214, 179, 106, 0.18);
          border-radius: 16px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .offer-top {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .offer-discount {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 22px;
          color: #d6b36a;
          font-weight: 400;
        }

        .offer-tag {
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(214, 179, 106, 0.12);
          color: #c9b896;
          font-weight: 600;
        }

        .offer-desc {
          margin: 0;
          font-size: 13px;
          color: #b7afa9;
          line-height: 1.45;
          flex: 1;
        }

        .offer-code-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .offer-code {
          flex: 1;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12px;
          letter-spacing: 0.06em;
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px dashed rgba(214, 179, 106, 0.3);
          color: #e8d9b8;
        }

        .offer-use-btn {
          border: 1px solid rgba(214, 179, 106, 0.45);
          background: rgba(214, 179, 106, 0.12);
          color: #d6b36a;
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: 0.2s ease;
        }

        .offer-use-btn:hover {
          background: rgba(214, 179, 106, 0.22);
          border-color: #d6b36a;
        }

        .offer-min {
          margin: 0;
          font-size: 11px;
          color: #7a736c;
        }

        .offers-loading,
        .empty-offers {
          padding: 22px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.08);
          color: #7a736c;
          font-size: 13px;
          text-align: center;
        }

        /* ── Empty appointments ── */
        .empty-card {
          border: 1px solid rgba(214, 179, 106, 0.15);
          border-radius: 22px;
          padding: 52px 28px;
          text-align: center;
          background: linear-gradient(
            165deg,
            rgba(214, 179, 106, 0.05),
            rgba(255, 255, 255, 0.015)
          );
          position: relative;
          overflow: hidden;
        }

        .empty-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse at 50% 0%,
            rgba(214, 179, 106, 0.07),
            transparent 60%
          );
          pointer-events: none;
        }

        .empty-visual {
          position: relative;
          display: flex;
          justify-content: center;
          margin-bottom: 18px;
        }

        .empty-ring {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #d6b36a;
          background: rgba(214, 179, 106, 0.08);
          border: 1px solid rgba(214, 179, 106, 0.25);
          box-shadow: 0 0 0 8px rgba(214, 179, 106, 0.04);
        }

        .empty-card h3 {
          position: relative;
          margin: 0 0 10px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 24px;
          font-weight: 400;
          color: #f4eee6;
        }

        .empty-card p {
          position: relative;
          margin: 0 auto 26px;
          max-width: 380px;
          color: #9a9088;
          font-size: 14px;
          line-height: 1.55;
        }

        .empty-card .primary-button {
          position: relative;
          width: auto;
          min-width: 200px;
        }

        /* ── Appointment cards ── */
        .appointments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .appointment-card {
          position: relative;
          background: linear-gradient(
            155deg,
            rgba(255, 255, 255, 0.05),
            rgba(255, 255, 255, 0.018)
          );
          border: 1px solid rgba(214, 179, 106, 0.12);
          border-radius: 20px;
          padding: 24px 24px 22px;
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .appointment-card:hover {
          border-color: rgba(214, 179, 106, 0.28);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
        }

        .card-accent {
          position: absolute;
          top: 0;
          left: 0;
          width: 3px;
          height: 100%;
          background: linear-gradient(
            180deg,
            #d6b36a,
            rgba(173, 138, 78, 0.3)
          );
          border-radius: 3px 0 0 3px;
        }

        .appointment-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .appointment-top h3 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 19px;
          font-weight: 400;
          line-height: 1.35;
          color: #f4eee6;
        }

        .status {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          padding: 5px 11px;
          border-radius: 999px;
          font-size: 10px;
          letter-spacing: 0.06em;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.06);
          color: #c9c0b6;
        }

        .status.confirmed {
          background: rgba(96, 165, 130, 0.14);
          color: #a9d5ba;
        }

        .status.approved {
          background: rgba(214, 179, 106, 0.14);
          color: #e0c98a;
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
          gap: 18px 14px;
          padding: 20px 0;
        }

        .detail {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 9px;
          letter-spacing: 0.16em;
          color: #6e675f;
          font-weight: 600;
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
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 14px;
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
          margin-top: 16px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .notes span {
          font-size: 9px;
          letter-spacing: 0.15em;
          color: #6e675f;
          font-weight: 600;
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
          gap: 9px;
          margin-top: 20px;
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
          border: 1px solid #d6b36a;
          background: linear-gradient(135deg, #d6b36a, #c9a25e);
          color: #1b1714;
          box-shadow: 0 4px 16px rgba(214, 179, 106, 0.2);
        }

        .primary-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(214, 179, 106, 0.3);
          background: linear-gradient(135deg, #e0c07a, #d6b36a);
        }

        .cancel-button {
          border: 1px solid rgba(220, 150, 150, 0.28);
          background: transparent;
          color: #d4a0a0;
        }

        .cancel-button:hover:not(:disabled) {
          border-color: rgba(220, 150, 150, 0.55);
          background: rgba(220, 150, 150, 0.06);
        }

        .primary-button:disabled,
        .cancel-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        /* ── History ── */
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .history-card {
          display: grid;
          grid-template-columns: 1.3fr 1.2fr 0.9fr;
          gap: 16px;
          align-items: center;
          padding: 16px 20px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.02);
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .history-card:hover {
          border-color: rgba(214, 179, 106, 0.15);
          background: rgba(255, 255, 255, 0.035);
        }

        .history-date,
        .history-service,
        .history-status {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .history-date strong,
        .history-service strong {
          font-size: 13px;
          font-weight: 500;
          color: #e9e3df;
        }

        .history-date span,
        .history-service span,
        .history-status small {
          color: #7a736c;
          font-size: 11px;
        }

        .history-status {
          align-items: flex-end;
        }

        .empty-history {
          padding: 28px 24px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.08);
          color: #7a736c;
          font-size: 13px;
          text-align: center;
        }

        /* ── Book again ── */
        .book-again {
          margin-top: 52px;
          padding: 32px 34px;
          border-radius: 22px;
          border: 1px solid rgba(214, 179, 106, 0.2);
          background: linear-gradient(
            135deg,
            rgba(214, 179, 106, 0.1),
            rgba(255, 255, 255, 0.02) 55%
          );
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
          position: relative;
          overflow: hidden;
        }

        .book-again::before {
          content: "";
          position: absolute;
          top: -40%;
          right: -10%;
          width: 280px;
          height: 280px;
          background: radial-gradient(
            circle,
            rgba(214, 179, 106, 0.12),
            transparent 65%
          );
          pointer-events: none;
        }

        .book-again-content {
          position: relative;
        }

        .book-again h2 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(22px, 3vw, 28px);
          font-weight: 400;
          color: #f4eee6;
        }

        .book-again p:last-of-type {
          margin: 8px 0 0;
          color: #9a9088;
          font-size: 13px;
          max-width: 420px;
          line-height: 1.5;
        }

        .book-cta {
          position: relative;
          width: auto !important;
          min-width: 150px;
          flex-shrink: 0;
        }

        /* ── Modal ── */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(8, 7, 6, 0.72);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-panel {
          width: 100%;
          max-width: 440px;
          background: #161412;
          border: 1px solid rgba(214, 179, 106, 0.2);
          border-radius: 20px;
          padding: 28px 26px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }

        .modal-header h2 {
          margin: 4px 0 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 26px;
          font-weight: 400;
          color: #f4eee6;
        }

        .modal-close {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          color: #c9c0b6;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: 0.15s ease;
        }

        .modal-close:hover {
          border-color: rgba(214, 179, 106, 0.4);
          color: #d6b36a;
        }

        .edit-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field span {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #9a9088;
          font-weight: 600;
        }

        .field input {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px 14px;
          color: #f4eee6;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .field input:focus {
          border-color: rgba(214, 179, 106, 0.5);
        }

        .field input::placeholder {
          color: #6e675f;
        }

        .field-hint {
          font-size: 11px;
          color: #6e675f;
        }

        .edit-error {
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(180, 70, 70, 0.12);
          border: 1px solid rgba(220, 100, 100, 0.25);
          color: #efb6b6;
          font-size: 13px;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        .modal-cancel,
        .modal-save {
          width: auto !important;
          flex: 1;
        }

        /* ── Responsive ── */
        @media (max-width: 720px) {
          .account-page {
            padding: 28px 16px 64px;
          }

          .profile-hero {
            flex-direction: column;
            align-items: flex-start;
          }

          .profile-actions {
            width: 100%;
          }

          .ghost-button,
          .logout-button {
            flex: 1;
            text-align: center;
          }

          .avatar {
            width: 56px;
            height: 56px;
          }

          .avatar span {
            font-size: 17px;
          }

          .loyalty-main {
            flex-direction: column;
            align-items: flex-start;
          }

          .loyalty-stat {
            text-align: left;
          }

          .stats-row {
            grid-template-columns: 1fr 1fr;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
            gap: 6px;
          }

          .appointments-grid {
            grid-template-columns: 1fr;
          }

          .appointment-card {
            padding: 20px 18px;
          }

          .history-card {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .history-status {
            align-items: flex-start;
          }

          .book-again {
            flex-direction: column;
            align-items: flex-start;
            padding: 26px 22px;
          }

          .book-cta {
            width: 100% !important;
          }
        }

        @media (max-width: 400px) {
          .stats-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
