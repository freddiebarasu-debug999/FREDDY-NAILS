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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get("code") || "").trim().toUpperCase();

  if (!code) {
    return Response.json(
      { error: "Enter a promo code." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("promo_codes")
    .select("code, discount_type, discount_value, description, active")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("Promo lookup error:", error);
    return Response.json(
      { error: "Unable to check that code right now." },
      { status: 500 }
    );
  }

  if (!data || !data.active) {
    return Response.json(
      { error: "That promo code isn't valid." },
      { status: 404 }
    );
  }

  return Response.json({
    code: data.code,
    discountType: data.discount_type,
    discountValue: Number(data.discount_value),
    description: data.description,
  });
}
