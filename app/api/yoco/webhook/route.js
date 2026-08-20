import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

function verifySignature(rawBody, headers) {
  const webhookId = headers.get("webhook-id");
  const webhookTimestamp = headers.get("webhook-timestamp");
  const webhookSignature = headers.get("webhook-signature");
  const secret = process.env.YOCO_WEBHOOK_SECRET;

  if (
    !webhookId ||
    !webhookTimestamp ||
    !webhookSignature ||
    !secret
  ) {
    return false;
  }

  const timestamp = Number(webhookTimestamp);
  const currentTime = Math.floor(Date.now() / 1000);

  if (
    !Number.isInteger(timestamp) ||
    Math.abs(currentTime - timestamp) > 180
  ) {
    console.error("Yoco webhook timestamp is too old or invalid.");
    return false;
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;

  const secretValue = secret.startsWith("whsec_")
    ? secret.slice(6)
    : secret;

  const secretBytes = Buffer.from(secretValue, "base64");

  const expectedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  const providedSignatures = webhookSignature
    .split(" ")
    .map((item) => item.split(",")[1])
    .filter(Boolean);

  return providedSignatures.some((signature) => {
    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    );
  });
}

function sanitizeForLogs(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeForLogs);
  }

  if (typeof value === "object") {
    const result = {};

    for (const [key, val] of Object.entries(value)) {
      const lowerKey = key.toLowerCase();

      if (
        lowerKey.includes("secret") ||
        lowerKey.includes("signature") ||
        lowerKey.includes("token") ||
        lowerKey.includes("authorization") ||
        lowerKey.includes("card") ||
        lowerKey.includes("cvv") ||
        lowerKey.includes("cvc") ||
        lowerKey.includes("password")
      ) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = sanitizeForLogs(val);
      }
    }

    return result;
  }

  return value;
}

export async function POST(request) {
  try {
    const rawBody = await request.text();

    const isValid = verifySignature(
      rawBody,
      request.headers
    );

    if (!isValid) {
      console.error("Invalid Yoco webhook signature.");

      return Response.json(
        { error: "Invalid webhook signature." },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);

    console.log("========================================");
    console.log("VERIFIED YOCO WEBHOOK RECEIVED");
    console.log("Event type:", event?.type);
    console.log(
      "Safe event structure:",
      JSON.stringify(sanitizeForLogs(event), null, 2)
    );
    console.log("========================================");

    return Response.json({
      received: true,
      diagnostic: true,
    });
  } catch (error) {
    console.error("Yoco webhook diagnostic error:", error);

    return Response.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
