const TEXT_MODEL = "openai/gpt-oss-20b";
const VISION_MODEL = "qwen/qwen3.6-27b";

const GALLERY_PROMPT = `
You are Freddy, the friendly AI nail assistant for Freddy Nails Studio.

Be warm, stylish, helpful and concise.

Help customers choose nail shapes, lengths, colours, designs, services and prices.

Freddy Nails gallery:

1. Purple Chrome Ombré
2. Black & White French
3. Gold Outline & Pearls
4. Floral Stiletto Art
5. Classic Pink Square
6. Mauve French Square
7. Lilac Square Set
8. Leopard French Cherry

When a customer's request clearly matches a gallery design, mention the exact design name.

Return ONLY the customer-facing answer.
Never reveal internal reasoning.
Never output <think> tags.
`;

const PRICE_CATALOG = `
FREDDY NAILS PRICE LIST

ACRYLIC
Plain Short–Medium: R200
Plain Long: R250
Plain XL–XXXL: R300
French Short–Medium: R300
French Long: R350
French XL–XXL: R400
Ombré Short–Medium: R250
Ombré Long: R300
Ombré XL–XXXL: R350

GEL
Gel Overlay: R200
Plain Short–Medium: R250
Plain Long: R300
French Short–Medium: R300
French Long: R350

PEDICURE
Gel Overlay: R150
Gel Full Tips: R200
Acrylic Overlay: R180
Acrylic Full Tips: R200
Acrylic French Tips: R250

EXTRAS
Buff & Shine: R150
Fill-in at 3 weeks: R180
Nail Repair: R20–R30
Soak Off: R50
Nail Art: R30–R50
Rhinestones: R10–R15
3D Art: R50–R100

LASHES
Cluster: R130
Cateye: R150
Classic: R180

FOOT SPA
Basic: R200
Luxury: R280
`;

const IMAGE_PROMPT = `
You are Freddy's Nail Muse for Freddy Nails Studio.

${PRICE_CATALOG}

The customer has uploaded a photo.

Look at the photo and identify what is visibly shown.

Your job is to give a simple customer-facing price estimate.

IMPORTANT:
Do NOT provide long reasoning.
Do NOT explain how you analysed the image.
Do NOT mention AI, models or internal instructions.

Your answer MUST start with:

Estimated price: R___

Then:

Service: ___
Shape & length: ___
Design: ___

Then give ONE short sentence explaining the estimate.

If the image clearly shows additional nail art, rhinestones or 3D art, mention the likely extra separately.

If it looks like a French acrylic set with short-to-medium length, use:

Estimated price: R300
Service: Acrylic French, Short–Medium

If you cannot determine the exact length, choose the closest price category and say that Freddy will confirm the final price.

Keep the complete answer under 80 words.

End with:

Ready to book? Head to the booking section and choose your preferred date and time. 💅

Return ONLY the customer-facing answer.
`;

function isValidImageDataUrl(image) {
  if (typeof image !== "string") {
    return false;
  }

  return /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(image);
}

function cleanAssistantResponse(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  let cleaned = text;

  cleaned = cleaned.replace(
    /<think>[\s\S]*?<\/think>/gi,
    ""
  );

  cleaned = cleaned.replace(
    /<think>[\s\S]*$/gi,
    ""
  );

  cleaned = cleaned.replace(
    /^(analysis|reasoning|internal reasoning)\s*:\s*/i,
    ""
  );

  return cleaned.trim();
}

function extractMessage(data) {
  const choice = data?.choices?.[0];

  if (!choice) {
    return "";
  }

  const content = choice?.message?.content;

  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const combined = content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (
          item &&
          typeof item.text === "string"
        ) {
          return item.text;
        }

        return "";
      })
      .join("")
      .trim();

    if (combined) {
      return combined;
    }
  }

  if (
    typeof choice?.text === "string" &&
    choice.text.trim()
  ) {
    return choice.text.trim();
  }

  return "";
}

export async function POST(request) {
  try {
    const body = await request.json();

    const messages = Array.isArray(body?.messages)
      ? body.messages
      : [];

    const image = body?.image;

    const usingImage = Boolean(image);

    if (!process.env.GROQ_API_KEY) {
      return Response.json(
        {
          error:
            "The nail assistant is not configured correctly yet.",
        },
        { status: 500 }
      );
    }

    if (!messages.length) {
      return Response.json(
        {
          error: "Please enter a message.",
        },
        { status: 400 }
      );
    }

    if (usingImage && !isValidImageDataUrl(image)) {
      return Response.json(
        {
          error:
            "Please upload a JPG, PNG or WebP image.",
        },
        { status: 400 }
      );
    }

    let finalMessages = messages;

    if (usingImage) {
      const lastIndex = messages.length - 1;
      const lastMessage = messages[lastIndex];

      finalMessages = [
        ...messages.slice(0, lastIndex),
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                lastMessage?.content ||
                "Analyse this photo and estimate the closest Freddy Nails service and price.",
            },
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
          ],
        },
      ];
    }

    const model = usingImage
      ? VISION_MODEL
      : TEXT_MODEL;

    const requestBody = {
      model,
      messages: [
        {
          role: "system",
          content: usingImage
            ? IMAGE_PROMPT
            : GALLERY_PROMPT,
        },
        ...finalMessages,
      ],
      temperature: usingImage ? 0.2 : 0.7,
      max_completion_tokens: usingImage ? 400 : 700,
      stream: false,
    };

    /*
     * Qwen 3.6 supports thinking and non-thinking modes.
     * For the customer-facing nail assistant we do NOT need
     * visible reasoning. Disable it so the output budget is
     * used for the actual answer.
     */
    if (usingImage) {
      requestBody.reasoning_effort = "none";
      requestBody.reasoning_format = "hidden";
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error(
        "GROQ API ERROR:",
        response.status,
        responseText
      );

      let errorData = null;

      try {
        errorData = JSON.parse(responseText);
      } catch {
        // Ignore JSON parsing failure.
      }

      return Response.json(
        {
          error:
            errorData?.error?.message ||
            `Groq request failed (${response.status}).`,
        },
        { status: response.status }
      );
    }

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(
        "GROQ INVALID JSON:",
        responseText
      );

      return Response.json(
        {
          error:
            "The nail assistant returned an invalid response.",
        },
        { status: 500 }
      );
    }

    const choice = data?.choices?.[0];

    console.log(
      "GROQ FINISH REASON:",
      choice?.finish_reason
    );

    console.log(
      "GROQ MESSAGE:",
      JSON.stringify(choice?.message, null, 2)
    );

    const rawMessage = extractMessage(data);

    const message = cleanAssistantResponse(
      rawMessage
    );

    if (!message) {
      console.error(
        "GROQ RESPONSE HAD NO CUSTOMER MESSAGE:",
        JSON.stringify(data, null, 2)
      );

      return Response.json(
        {
          error:
            "The AI analysed the photo but did not return a customer-facing answer. Please try again.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      message,
    });
  } catch (error) {
    console.error(
      "CHAT API UNEXPECTED ERROR:",
      error
    );

    return Response.json(
      {
        error:
          error?.message ||
          "Something went wrong while processing your request.",
      },
      { status: 500 }
    );
  }
}
