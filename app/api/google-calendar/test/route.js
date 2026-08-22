import { NextResponse } from "next/server";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";

export async function GET() {
  try {
    const testAppointment = {
      id: "00000000-0000-0000-0000-000000000001",
      customer_name: "Freddy Nails Calendar Test",
      customer_phone: "+27 71 088 8897",
      customer_email: "freddiebarasu@gmail.com",
      service_name: "Calendar Integration Test",
      client_count: 1,
      booking_date: "2026-08-24",
      start_time: "10:00",
      end_time: "10:30",
      duration_minutes: 30,
      notes: "Temporary Google Calendar integration test.",
      deposit_amount: 90,
      payment_status: "paid",
      booking_status: "confirmed",
      google_event_id: null,
    };

    const result =
      await createGoogleCalendarEvent(
        testAppointment
      );

    return NextResponse.json({
      success: true,
      message:
        "Google Calendar test event created successfully.",
      result,
    });
  } catch (error) {
    console.error(
      "Google Calendar test failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Google Calendar test failed.",
      },
      { status: 500 }
    );
  }
}
