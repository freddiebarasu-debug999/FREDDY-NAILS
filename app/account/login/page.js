"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      if (loginError) {
        throw loginError;
      }
      if (!data.user) {
        throw new Error("Unable to log in. Please try again.");
      }
      window.location.href = "/account";
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err?.message ||
          "Unable to log in. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  }
  async function handleForgotPassword() {
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo:
              `${window.location.origin}/account/reset-password`,
          }
        );
      if (resetError) {
        throw resetError;
      }
      setMessage(
        "Password reset instructions have been sent to your email."
      );
    } catch (err) {
      console.error("Password reset error:", err);
      setError(
        err?.message ||
          "We couldn't send the password reset email."
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
            Welcome back
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#a79a87]">
            Log in to manage your appointments, profile and
            booking history.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-5"
        >
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-[#c9c0b6]">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full rounded-sm border border-white/[0.12] bg-[#181614] px-4 py-3.5 text-sm text-[#f4eee6] outline-none transition-colors placeholder:text-[#817970] focus:border-[#d6b36a]"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-[#c9c0b6]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              required
              className="w-full rounded-sm border border-white/[0.12] bg-[#181614] px-4 py-3.5 text-sm text-[#f4eee6] outline-none transition-colors placeholder:text-[#817970] focus:border-[#d6b36a]"
            />
          </div>
          {error && (
            <div className="border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          {message && (
            <div className="border border-[#d6b36a]/30 bg-[#d6b36a]/10 px-4 py-3 text-sm text-[#d6b36a]">
              {message}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-[#d6b36a] px-5 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-[#11100f] transition-colors hover:bg-[#ad8a4e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={loading}
          className="mt-5 w-full text-center text-sm text-[#a79a87] transition-colors hover:text-[#d6b36a] disabled:opacity-50"
        >
          Forgot your password?
        </button>
        <p className="mt-8 text-center text-sm text-[#8f877e]">
          Don't have an account?{" "}
          <a
            href="/account/signup"
            className="font-semibold text-[#d6b36a] hover:text-[#f0d18a]"
          >
            Create one
          </a>
        </p>
      </div>
    </main>
  );
}
