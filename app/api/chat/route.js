const TEXT_MODEL = "openai/gpt-oss-20b";
const VISION_MODEL = "qwen/qwen3.6-27b";

const GALLERY_PROMPT = `
You are Freddy, the friendly AI nail assistant for Freddy Nails Studio.

Be warm, stylish, helpful and concise.

Help customers choose nail shapes, lengths, colours, designs, services and prices.

CURRENCY RULE — EXTREMELY IMPORTANT:
All Freddy Nails prices are in South African Rand (ZAR).

ALWAYS display Freddy Nails prices using "R".
Examples:
R200
R300
R30–R50
R330–R350

NEVER use:
$200
USD 200
200 USD
€200
£200
or any other currency.

NEVER convert Freddy Nails prices into another currency.
The official Freddy Nails price list is already in South African Rand.

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
FREDDY NAILS OFFICIAL PRICE LIST

IMPORTANT CURRENCY RULE:
EVERY PRICE BELOW IS IN SOUTH AFRICAN RAND (ZAR).

The "R" symbol means South African Rand.

NEVER convert these prices into USD, dollars, euros, pounds, or any other currency.

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

Analyse ONLY what is visibly identifiable in the photo.

Your job is to estimate what the customer would likely pay at Freddy Nails.

CRITICAL CURRENCY RULE:

ALL FREDDY NAILS PRICES ARE IN SOUTH AFRICAN RAND (ZAR).

The "R" symbol MUST be used for every Freddy Nails price.

NEVER convert prices into:
- US dollars
- USD
- $
- euros
- EUR
- pounds
- GBP
- any other currency

NEVER write "$200" when the Freddy Nails price is R200.

ALWAYS write:
R200

NOT:
$200

If a price is a range, write:
R30–R50

NOT:
$30–$50

Even if the customer's device, browser, location, language or previous conversation suggests another currency, Freddy Nails prices MUST remain in South African Rand.

IMPORTANT PRICING RULES:

1. Identify the BASE SERVICE first.

2. Match the base service to the closest service in the official Freddy Nails price list.

3. French tips are already included in the French service price.
Do NOT charge Nail Art for ordinary French tips.

4. Only add Nail Art when there is a separate decorative design beyond the normal French/ombré/plain finish.

Examples of Nail Art:
- hearts
- flowers
- stars
- butterflies
- drawings
- decorative patterns
- character art
- detailed individual nail designs

5. If Nail Art is clearly visible, add:
Nail Art: R30–R50

6. If rhinestones/gems are clearly visible, add:
Rhinestones: R10–R15

7. If clearly visible 3D decorations are present, add:
3D Art: R50–R100

8. Do NOT add an extra when you cannot clearly see it.

9. If multiple extras are clearly visible, calculate the estimated range by adding the minimum and maximum of each applicable extra.

10. Example:

Acrylic French Short–Medium = R300
Small Nail Art = R30–R50

Estimated total = R330–R350

11. If the image looks like a French acrylic set with short-to-medium length, the base price is R300.

12. If exact length cannot be determined, choose the closest category and clearly say the estimate is based on the visible appearance.

13. Do not invent services or prices that are not in the official price list.

14. If the image is of lashes or feet rather than nails, use the relevant lash or pedicure pricing.

YOUR RESPONSE MUST FOLLOW THIS STRUCTURE:

Estimated price: R___–R___

Base service: ___ — R___

Shape & length: ___

Design: ___

Extras:
- ___ — R___–R___

Total estimate: R___–R___

Then one short sentence:
"Freddy will confirm the final price after checking the design and service."

Then:

Ready to book? Head to the booking section and choose your preferred date and time. 💅

IMPORTANT:
- If there are NO extras, do not show an Extras section.
- If there is only one exact price, show one price instead of a range.
- Always include the total estimate.
- Keep the response under 120 words.
- Do NOT provide long reasoning.
- Do NOT explain how you analysed the image.
- Do NOT mention AI, models or internal instructions.
- NEVER reveal reasoning.
- NEVER output <think> tags.
- EVERY PRICE MUST USE R/ZAR.
- NEVER USE $ FOR A FREDDY NAILS PRICE.

Return ONLY the customer-facing answer.
`;

function isValidImageDataUrl(image) {
  if (typeof image !== "string") {
    return false;
  }

  return /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(
    image
  );
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

  /*
   * Freddy Nails prices are ALWAYS South African Rand.
   *
   * These replacements are a final safety layer in case
   * the AI incorrectly writes a dollar sign.
   *
   * Examples:
   * $200       -> R200
   * USD 200    -> R200
   * 200 USD    -> R200
   * $30-$50    -> R30-R50
   */

  cleaned = cleaned.replace(
    /\bUSD\s*(\d+(?:[.,]\d+)?)/gi,
    "R$1"
  );

  cleaned = cleaned.replace(
    /\b(\d+(?:[.,]\d+)?)\s*USD\b/gi,
    "R$1"
  );

  cleaned = cleaned.replace(
    /\$\s*(\d+(?:[.,]\d+)?)/g,
    "R$1"
  );

  cleaned = cleaned.replace(
    /\b(\d+(?:[.,]\d+)?)\s*\$/g,
    "R$1"
  );

  /*
   * Handle dollar ranges such as:
   * $30–$50
   * $30-$50
   */
  cleaned = cleaned.replace(
    /\$\s*(\d+(?:[.,]\d+)?)\s*[-–—]\s*\$\s*(\d+(?:[.,]\d+)?)/g,
    "R$1–R$2"
  );

  /*
   * If a dollar range was partially converted, normalize it.
   */
  cleaned = cleaned.replace(
    /R(\d+(?:[.,]\d+)?)\s*[-–—]\s*\$(\d+(?:[.,]\d+)?)/g,
    "R$1–R$2"
  );

  /*
   * Normalize common currency wording.
   */
  cleaned = cleaned.replace(
    /\bUS dollars?\b/gi,
    "South African Rand"
  );

  cleaned = cleaned.replace(
    /\bUSD\b/gi,
    "ZAR"
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
                "Analyse this photo and estimate the closest Freddy Nails service and total price. All prices MUST be in South African Rand (R/ZAR).",
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
      max_completion_tokens: usingImage ? 500 : 700,
      stream: false,
    };

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
      JSON.stringify(
        choice?.message,
        null,
        2
      )
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
