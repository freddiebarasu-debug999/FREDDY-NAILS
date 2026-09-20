import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function normalizeCode(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCode = searchParams.get("code");
    const code = normalizeCode(rawCode);

    if (!code) {
      return NextResponse.json({
        step: "input",
        error: "No promo code supplied",
      });
    }

    if (!supabaseUrl) {
      return NextResponse.json({
        step: "environment",
        error: "SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL are both missing",
      });
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json({
        step: "environment",
        error: "SUPABASE_SERVICE_ROLE_KEY is missing",
      });
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code)
      .limit(1);

    if (error) {
      return NextResponse.json({
        step: "supabase_query",
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }

    return NextResponse.json({
      step: "success",
      searchedFor: code,
      rowsFound: data?.length || 0,
      promo: data?.[0] || null,
    });
  } catch (error) {
    return NextResponse.json({
      step: "unexpected_error",
      error: error?.message || String(error),
      stack: error?.stack || null,
    });
  }
}
