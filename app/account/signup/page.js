"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignUpPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function sendWelcomeEmail(name, email) {
    try {
      const response = await fetch("/api/account/welcome-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        console.error(
          "Welcome email failed:",
          result?.error || "Unknown error"
        );

        return false;
      }

      return true;
    } catch (error) {
      console.error("Welcome email request failed:", error);
      return false;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.password
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (form.password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const name = form.fullName.trim();
      const email = form.email.trim();

      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password: form.password,
          options: {
            data: {
              full_name: name,
              phone: form.phone.trim(),
            },
          },
        });

      if (signUpError) {
        throw signUpError;
      }

      if (!data?.user) {
        throw new Error(
          "Your account could not be created. Please try again."
        );
      }

      /*
       * The Supabase account/profile creation remains
       * exactly as before.
       *
       * The only new step is sending the Freddy Nails
       * welcome email after the account is successfully created.
       *
       * If the welcome email fails, the customer's account
       * is still considered successfully created.
       */
      await sendWelcomeEmail(name, email);

      /*
       * When email confirmation is enabled,
       * Supabase normally returns no session until
       * the customer confirms their email.
       */
      if (!data.session) {
        setMessage(
          "Welcome to Freddy Nails! Your account has been created successfully. Please check your email and confirm your account before logging in."
        );

        setForm((current) => ({
          ...current,
          password: "",
          confirmPassword: "",
        }));

        return;
      }

      window.location.href = "/account";
    } catch (err) {
      console.error("Sign up error:", err);

      setError(
        err?.message ||
          "Something went wrong while creating your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#11100f] px-5 py-16 text-[#f4eee6]">
      <div className="mx-auto max-w-[460px]">
        <a
          href="/"
          className="text-sm text-[#a79a87] transition-colors hover:text-[#d6b36a]"
        >
          ← Back to Freddy Nails
        </a>

        <div className="mt-10">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
            Freddy Nails
          </p>

          <h1 className="mt-3 font-serif text-4xl text-[#f4eee6]">
            Create your account
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-[#a79a87]">
            Save your details, manage your appointments and keep
            track of your Freddy Nails bookings in one place.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-[#c9c0b6]">
              Full name
            </label>

            <input
              type="text"
              value={form.fullName}
              onChange={(e) =>
                updateField("fullName", e.target.value)
              }
              placeholder="Your full name"
              autoComplete="name"
              required
              className="w-full rounded-sm border border-white/[0.12] bg-[#181614] px-4 py-3.5 text-sm text-[#f4eee6] outline-none transition-colors placeholder:text-[#817970] focus:border-[#d6b36a]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-[#c9c0b6]">
              Email address
            </label>

            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                updateField("email", e.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full rounded-sm border border-white/[0.12] bg-[#181614] px-4 py-3.5 text-sm text-[#f4eee6] outline-none transition-colors placeholder:text-[#817970] focus:border-[#d6b36a]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-[#c9c0b6]">
              Phone number
            </label>

            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                updateField("phone", e.target.value)
              }
              placeholder="+27 ..."
              autoComplete="tel"
              required
              className="w-full rounded-sm border border-white/[0.12] bg-[#181614] px-4 py-3.5 text-sm text-[#f4eee6] outline-none transition-colors placeholder:text-[#817970] focus:border-[#d6b36a]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-[#c9c0b6]">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  updateField("password", e.target.value)
                }
                placeholder="At least 6 characters"
                autoComplete="new-password"
                required
                className="w-full rounded-sm border border-white/[0.12] bg-[#181614] px-4 py-3.5 pr-12 text-sm text-[#f4eee6] outline-none transition-colors placeholder:text-[#817970] focus:border-[#d6b36a]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a79a87] transition-colors hover:text-[#d6b36a]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-[#c9c0b6]">
              Confirm password
            </label>

            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) =>
                  updateField("confirmPassword", e.target.value)
                }
                placeholder="Enter your password again"
                autoComplete="new-password"
                required
                className="w-full rounded-sm border border-white/[0.12] bg-[#181614] px-4 py-3.5 pr-12 text-sm text-[#f4eee6] outline-none transition-colors placeholder:text-[#817970] focus:border-[#d6b36a]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a79a87] transition-colors hover:text-[#d6b36a]"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="border border-[#d6b36a]/30 bg-[#d6b36a]/10 px-4 py-3 text-sm leading-relaxed text-[#d6b36a]">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-[#d6b36a] px-5 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-[#11100f] transition-colors hover:bg-[#ad8a4e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-[#8f877e]">
          Already have an account?{" "}
          <a
            href="/account/login"
            className="font-semibold text-[#d6b36a] hover:text-[#f0d18a]"
          >
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}
