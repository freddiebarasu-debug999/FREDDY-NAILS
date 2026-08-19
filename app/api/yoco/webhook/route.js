import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function verifySignature(rawBody, signature, secret) {
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const receivedSignature = signature.startsWith("sha256=")
    ? signature.slice(7)
    : signature;

  if (expectedSignature.length !== receivedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  );
}

export async function POST(request) {
  try {
    const rawBody = await request.text();

    const signature = request.headers.get("webhook-signature");

    const isValid = verifySignature(
      rawBody,
      signature,
      process.env.YOCO_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error("Invalid Yoco webhook signature.");

      return Response.json(
        { error: "Invalid webhook signature." },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);

    console.log("Verified Yoco webhook:", event.type);

    if (event.type !== "payment.succeeded") {
      return Response.json({ received: true });
    }

    const payment = event.payload;

    const checkoutId = payment?.metadata?.checkoutId;

    if (!checkoutId) {
      console.error("Yoco payment has no checkoutId.");

      return Response.json(
        { error: "Missing checkout ID." },
        { status: 400 }
      );
    }

    const { data: appointment, error: findError } = await supabase
      .from("appointments")
      .select("id, deposit_amount, payment_status, booking_status")
      .eq("yoco_checkout_id", checkoutId)
      .maybeSingle();

    if (findError) {
      console.error("Supabase lookup error:", findError);

      return Response.json(
        { error: "Unable to find appointment." },
        { status: 500 }
      );
    }

    if (!appointment) {
      console.error(
        "No appointment found for Yoco checkout:",
        checkoutId
      );

      return Response.json(
        { error: "Appointment not found." },
        { status: 404 }
      );
    }

    const paidAmount = Number(payment.amount);
    const expectedAmount = Number(appointment.deposit_amount) * 100;

    if (paidAmount !== expectedAmount) {
      console.error("Yoco payment amount mismatch.", {
        appointmentId: appointment.id,
        expectedAmount,
        paidAmount,
      });

      return Response.json(
        { error: "Payment amount mismatch." },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        payment_status: "paid",
        booking_status: "confirmed",
        yoco_payment_id: payment.id,
      })
      .eq("id", appointment.id);

    if (updateError) {
      console.error("Supabase payment update error:", updateError);

      return Response.json(
        { error: "Unable to confirm appointment." },
        { status: 500 }
      );
    }

    console.log(
      "Appointment confirmed after successful Yoco payment:",
      appointment.id
    );

    return Response.json({ received: true });
  } catch (error) {
    console.error("Yoco webhook processing error:", error);

    return Response.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
