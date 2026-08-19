export async function POST(request) {
  try {
    const body = await request.json();
    const clientCount = Number(body.clientCount);
    if (!Number.isInteger(clientCount) || clientCount < 1 || clientCount > 4) {
      return Response.json(
        { error: "Invalid number of clients." },
        { status: 400 }
      );
    }
    // R90 deposit per client.
    // This is calculated on the server so the customer cannot
    // change the deposit amount in the browser.
    const depositPerClient = 90;
    const depositAmount = depositPerClient * clientCount;
    // Yoco expects the amount in cents.
    const amountInCents = depositAmount * 100;
    const response = await fetch(
      "https://payments.yoco.com/api/checkouts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
        },
        body: JSON.stringify({
          amount: amountInCents,
          currency: "ZAR",
          successUrl: "https://freddy-nails.vercel.app/?booking=success",
          cancelUrl: "https://freddy-nails.vercel.app/?booking=cancelled",
          failureUrl: "https://freddy-nails.vercel.app/?booking=failed",
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      console.error("Yoco checkout error:", data);
      return Response.json(
        { error: "Unable to create Yoco checkout." },
        { status: 500 }
      );
    }
    return Response.json({
      checkoutId: data.id,
      redirectUrl: data.redirectUrl,
      amount: depositAmount,
    });
  } catch (error) {
    console.error("Checkout API error:", error);
    return Response.json(
      { error: "Something went wrong creating the payment." },
      { status: 500 }
    );
  }
}
