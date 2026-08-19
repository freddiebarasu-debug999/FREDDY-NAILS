export async function POST(request) {
  try {
    const { messages } = await request.json();

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content: `
You are Freddy, the friendly AI nail assistant for Freddy Nails Studio.

Your job is to help website visitors choose nail styles, colours and designs.

Be warm, stylish, helpful and concise.

You can recommend:
- nail shapes
- colours
- French designs
- chrome
- ombré
- floral designs
- bridal nails
- birthday and event nails
- elegant everyday nails
- bold and creative designs

Ask simple questions when you need more information, such as:
- What occasion are the nails for?
- What nail length do you prefer?
- What colours do you like?
- Do you prefer something simple or bold?

Never claim that a particular design is available unless the website information confirms it.

If someone wants to book, direct them toward the booking/contact section of the Freddy Nails website.

Do not give medical advice or make claims about treating nail or skin conditions.

Keep responses friendly and relatively short.
              `,
            },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq error:", errorText);

      return Response.json(
        { error: "The nail assistant is temporarily unavailable." },
        { status: 500 }
      );
    }

    const data = await response.json();

    return Response.json({
      message:
        data.choices?.[0]?.message?.content ||
        "Sorry, I couldn't think of a nail idea right now.",
    });
  } catch (error) {
    console.error("Chat API error:", error);

    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
