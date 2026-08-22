"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function prepareReset() {
      try {
        /*
         * Supabase may send the recovery link using
         * a PKCE "code" query parameter.
         */
        const params = new URLSearchParams(
          window.location.search
        );

        const code = params.get("code");

        if (code) {
          const {
            error: exchangeError,
          } =
            await supabase.auth.exchangeCodeForSession(
              code
            );

          if (exchangeError) {
            throw exchangeError;
          }
        }

        /*
         * Also listen for Supabase's PASSWORD_RECOVERY
         * event. This supports recovery links that arrive
         * using Supabase's recovery session flow.
         */
        const {
          data: authListener,
        } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (
              event === "PASSWORD_RECOVERY" &&
              session
            ) {
              if (mounted) {
                setReady(true);
                setLoading(false);
              }
            }
          }
        );

        /*
         * Check whether a recovery session already
         * exists.
         */
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) {
          authListener.subscription.unsubscribe();
          return;
        }

        if (session) {
          setReady(true);
        } else {
          setError(
            "This password reset link is invalid or has expired. Please request a new password reset email."
          );
        }

        setLoading(false);

        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (err) {
        console.error(
          "Password recovery error:",
          err
        );

        if (mounted) {
          setError(
            err?.message ||
              "This password reset link is invalid or has expired."
          );

          setLoading(false);
        }
      }
    }

    prepareReset();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleUpdatePassword(event) {
    event.preventDefault();

    setError("");
    setSuccess(false);

    if (password.length < 6) {
      setError(
        "Your new password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Your passwords do not match."
      );
      return;
    }

    setUpdating(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Your password reset session has expired. Please request a new reset link."
        );
      }

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");

      /*
       * Give the user a moment to see the success
       * message before taking them back to login.
       */
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href =
          "/account/login?reset=success";
      }, 1800);
    } catch (err) {
      console.error(
        "Password update error:",
        err
      );

      setError(
        err?.message ||
          "We couldn't update your password. Please request a new reset link."
      );
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#11100f] px-5 py-16 text-[#f4eee6]">
        <div className="mx-auto max-w-[460px]">
          <p className="text-sm text-[#8f877e]">
            Preparing your password reset...
          </p>
        </div>
      </main>
    );
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
            Create a new password
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-[#a79a87]">
            Choose a new password for your Freddy
            Nails client account.
          </p>
        </div>

        {error && (
          <div className="mt-8 border border-red-400/30 bg-red-400/10 px-4 py-4 text-sm leading-relaxed text-red-300">
            {error}

            <div className="mt-4">
              <a
                href="/account/login"
                className="font-semibold text-[#d6b36a] hover:text-[#f0d18a]"
              >
                Return to login →
              </a>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-8 border border-emerald-400/30 bg-emerald-400/10 px-4 py-4 text-sm leading-relaxed text-emerald-300">
            Your password has been updated
            successfully.

            <br />

            <span className="text-emerald-300/80">
              Taking you back to login...
            </span>
          </div>
        )}

        {ready && !success && (
          <form
            onSubmit={handleUpdatePassword}
            className="mt-10 space-y-5"
          >
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-[#c9c0b6]">
                New password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="At least 6 characters"
                autoComplete="new-password"
                required
                className="w-full rounded-sm border border-white/[0.12] bg-[#181614] px-4 py-3.5 text-sm text-[#f4eee6] outline-none transition-colors placeholder:text-[#817970] focus:border-[#d6b36a]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-[#c9c0b6]">
                Confirm new password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Enter your password again"
                autoComplete="new-password"
                required
                className="w-full rounded-sm border border-white/[0.12] bg-[#181614] px-4 py-3.5 text-sm text-[#f4eee6] outline-none transition-colors placeholder:text-[#817970] focus:border-[#d6b36a]"
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full rounded-sm bg-[#d6b36a] px-5 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-[#11100f] transition-colors hover:bg-[#ad8a4e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updating
                ? "Updating password..."
                : "Update Password"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-[#8f877e]">
          Remember your password?{" "}
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
