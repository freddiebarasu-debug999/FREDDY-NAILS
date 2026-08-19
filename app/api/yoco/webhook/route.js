import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const event = await request.json();

    console.log("Yoco webhook received:", event);

    return Response.json({ received: true });
  } catch (error) {
    console.error("Yoco webhook error:", error);

    return Response.json(
      { error: "Invalid webhook request." },
      { status: 400 }
    );
  }
}
