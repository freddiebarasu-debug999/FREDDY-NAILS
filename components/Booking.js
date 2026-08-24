"use client";

import { useMemo, useState } from "react";

const DEPOSIT_PER_CLIENT = 90;

const PROMO_SUGGESTIONS = [
  {
    title: "First Visit",
    description: "New to Freddy Nails? Use your first-visit offer.",
    code: "FIRSTVISIT",
  },
  {
    title: "Bring a Friend",
    description: "Bring someone along and use your friend offer.",
    code: "BRINGAFRIEND",
  },
  {
    title: "Birthday",
    description: "Celebrate your birthday with a Freddy Nails offer.",
    code: "BIRTHDAY",
  },
];

function formatMoney(amount) {
  return `R${Number(amount || 0).toLocaleString("en-ZA")}`;
}

function calculateDiscount(amount, promo) {
  if (!promo?.valid) {
    return {
      discount: 0,
      total: amount,
    };
  }

  const value = Number(promo.discountValue);

  if (!Number.isFinite(value) || value < 0) {
    return {
      discount: 0,
      total: amount,
    };
  }

  if (promo.discountType === "percent") {
    const percentage = Math.min(value, 100);
    const discount = Math.round(
      amount * (percentage / 100)
    );

    return {
      discount,
      total: Math.max(0, amount - discount),
    };
  }

  if (promo.discountType === "fixed") {
    const discount = Math.min(
      amount,
      Math.round(value)
    );

    return {
      discount,
      total: Math.max(0, amount - discount),
    };
  }

  return {
    discount: 0,
    total: amount,
  };
}

export default function Booking() {
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  /*
   * Keep your existing booking state/form logic below this point.
   *
   * These values are intentionally initialized safely so the promo
   * section can be used without causing JSON or undefined errors.
   */

  const [clientCount, setClientCount] = useState(1);

  const [clientServices, setClientServices] = useState([
    [],
  ]);

  const serviceTotalAmount = useMemo(() => {
    return clientServices.reduce(
      (total, services) => {
        return (
          total +
          services.reduce((clientTotal, service) => {
            const match = String(service).match(
              /\(R(\d+)(?:–\d+)?\)/
            );

            return (
              clientTotal +
              (match ? Number(match[1]) : 0)
            );
          }, 0)
        );
      },
      0
    );
  }, [clientServices]);

  const promoCalculation = useMemo(
    () =>
      calculateDiscount(
        serviceTotalAmount,
        appliedPromo
      ),
    [serviceTotalAmount, appliedPromo]
  );

  const depositAmount =
    DEPOSIT_PER_CLIENT * clientCount;

  async function applyPromoCode(codeOverride = null) {
    const code = String(
      codeOverride ?? promoCode
    )
      .trim()
      .toUpperCase();

    if (!code) {
      setPromoError("Please enter a promo code.");
      setAppliedPromo(null);
      return;
    }

    setPromoLoading(true);
    setPromoError("");

    try {
      const response = await fetch(
        `/api/promo/validate?code=${encodeURIComponent(
          code
        )}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      /*
       * IMPORTANT:
       * Do NOT call response.json() directly.
       *
       * If the server ever returns an empty body, HTML,
       * or another unexpected response, response.json()
       * throws "Unexpected end of JSON input".
       *
       * Reading text first lets us safely handle every response.
       */
      const responseText = await response.text();

      let data = {};

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(
            "Promo response JSON parse error:",
            parseError,
            responseText
          );

          throw new Error(
            "Unable to verify the promo code. Please try again."
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "That promo code isn't valid."
        );
      }

      if (!data?.valid) {
        throw new Error(
          data?.error ||
            "That promo code isn't valid."
        );
      }

      const validatedPromo = {
        valid: true,
        code: data.code || code,
        discountType: data.discountType,
        discountValue: Number(
          data.discountValue
        ),
        description:
          data.description || "",
      };

      setAppliedPromo(validatedPromo);
      setPromoCode(validatedPromo.code);
      setPromoError("");
    } catch (error) {
      console.error(
        "Apply promo error:",
        error
      );

      setAppliedPromo(null);

      setPromoError(
        error?.message ||
          "Unable to verify the promo code. Please try again."
      );
    } finally {
      setPromoLoading(false);
    }
  }

  function removePromo() {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
  }

  function selectSuggestedPromo(code) {
    setPromoCode(code);
    setPromoError("");

    /*
     * Automatically verify the selected offer.
     */
    applyPromoCode(code);
  }

  async function handleBookingSubmit(event) {
    event.preventDefault();

    /*
     * Keep your existing booking validation and submission
     * logic here.
     *
     * When calling /api/checkout, make sure you send:
     *
     * promoCode: appliedPromo?.code || null
     *
     * The checkout API will then calculate the discounted
     * service amount while keeping the Yoco deposit at
     * R90 per client.
     */
  }

  return (
    <form
      onSubmit={handleBookingSubmit}
      className="w-full"
    >
      {/* YOUR EXISTING BOOKING FORM CONTENT GOES ABOVE/AROUND THIS SECTION */}

      <section className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">
            Have a promo code?
          </h3>

          <p className="mt-1 text-sm text-white/60">
            Enter your code to apply your discount.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={promoCode}
            onChange={(event) => {
              setPromoCode(
                event.target.value.toUpperCase()
              );
              setPromoError("");

              if (appliedPromo) {
                setAppliedPromo(null);
              }
            }}
            placeholder="Enter promo code"
            autoComplete="off"
            className="min-h-[48px] flex-1 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/40"
          />

          <button
            type="button"
            onClick={() => applyPromoCode()}
            disabled={
              promoLoading ||
              !promoCode.trim()
            }
            className="min-h-[48px] rounded-xl border border-white/20 bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {promoLoading
              ? "Checking..."
              : "Apply"}
          </button>
        </div>

        {promoError ? (
          <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {promoError}
          </div>
        ) : null}

        {appliedPromo ? (
          <div className="mt-3 rounded-xl border border-green-400/20 bg-green-400/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-green-200">
                  {appliedPromo.code} applied
                </p>

                {appliedPromo.description ? (
                  <p className="mt-1 text-xs text-green-100/70">
                    {appliedPromo.description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={removePromo}
                className="text-xs text-green-100 underline underline-offset-2"
              >
                Remove
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {/* WAYS TO SAVE */}

      <section className="mt-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">
            Ways to Save
          </h3>

          <p className="mt-1 text-sm text-white/60">
            Tap an offer to automatically apply its promo code.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {PROMO_SUGGESTIONS.map((offer) => {
            const isSelected =
              appliedPromo?.code ===
              offer.code;

            return (
              <button
                key={offer.code}
                type="button"
                onClick={() =>
                  selectSuggestedPromo(
                    offer.code
                  )
                }
                disabled={promoLoading}
                className={`group rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-green-400/40 bg-green-400/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-white">
                      {offer.title}
                    </h4>

                    <p className="mt-1 text-xs leading-5 text-white/55">
                      {offer.description}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[10px] font-semibold tracking-wide text-white/70">
                    {offer.code}
                  </span>
                </div>

                <div className="mt-4 text-xs font-semibold text-white/70 group-hover:text-white">
                  {isSelected
                    ? "Applied ✓"
                    : "Apply offer →"}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* PRICE SUMMARY */}

      <section className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5">
        <h3 className="text-lg font-semibold text-white">
          Booking Summary
        </h3>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4 text-white/70">
            <span>Services</span>
            <span>
              {formatMoney(
                serviceTotalAmount
              )}
            </span>
          </div>

          {appliedPromo &&
          promoCalculation.discount > 0 ? (
            <div className="flex justify-between gap-4 text-green-300">
              <span>
                Promo (
                {appliedPromo.code})
              </span>

              <span>
                -
                {formatMoney(
                  promoCalculation.discount
                )}
              </span>
            </div>
          ) : null}

          <div className="flex justify-between gap-4 border-t border-white/10 pt-3 font-semibold text-white">
            <span>Discounted services</span>
            <span>
              {formatMoney(
                promoCalculation.total
              )}
            </span>
          </div>

          <div className="flex justify-between gap-4 text-white/70">
            <span>
              Deposit ({clientCount} × R90)
            </span>

            <span>
              {formatMoney(depositAmount)}
            </span>
          </div>

          <p className="pt-2 text-xs leading-5 text-white/45">
            Your booking deposit is R90 per client.
            Promo discounts apply to your service
            total and do not reduce the deposit.
          </p>
        </div>
      </section>

      {/* YOUR EXISTING BOOKING SUBMIT BUTTON / REMAINING FORM CONTENT */}
    </form>
  );
}
