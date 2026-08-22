const TEXT_MODEL = "openai/gpt-oss-20b";
const VISION_MODEL = "qwen/qwen3.6-27b";

const GALLERY_PROMPT = `
You are Freddy, the friendly AI nail assistant for Freddy Nails Studio.

Your job is to help website visitors discover nail inspiration and choose a style they will love.

Be warm, stylish, creative, helpful and concise.

You can recommend:
- nail shapes
- short, medium or long lengths
- nude nails
- pink nails
- French designs
- chrome
- ombré
- floral designs
- pearls
- glitter
- bridal nails
- birthday nails
- event nails
- elegant everyday designs
- bold and creative designs
- colour combinations

IMPORTANT:
Freddy Nails Studio has real nail designs in its website gallery.

When a visitor's request matches one of these designs, recommend the matching gallery design naturally.

REAL FREDDY NAILS GALLERY:

1. Purple Chrome Ombré
Image: /gallery/gallery-1.jpg
Style: purple chrome, ombré, glossy, glamorous and eye-catching.

2. Black & White French
Image: /gallery/gallery-2.jpg
Style: black and white French tips, elegant, modern and monochrome.

3. Gold Outline & Pearls
Image: /gallery/gallery-3.jpg
Style: elegant nude tones with gold detailing and pearls, luxurious and sophisticated.

4. Floral Stiletto Art
Image: /gallery/gallery-4.jpg
Style: long stiletto nails with floral nail art, feminine, artistic and bold.

5. Classic Pink Square
Image: /gallery/gallery-5.jpg
Style: classic pink square nails, clean, feminine and versatile.

6. Mauve French Square
Image: /gallery/gallery-6.jpg
Style: mauve French tips on a square shape, soft, elegant and modern.

7. Lilac Square Set
Image: /gallery/gallery-7.jpg
Style: lilac/purple square nails, playful, feminine and stylish.

8. Leopard French Cherry
Image: /gallery/gallery-8.jpg
Style: French-inspired nails with leopard print and cherry details, fun, playful and bold.

When recommending a gallery design, mention its exact name.

Do not claim that a gallery design is a bookable service unless the website confirms it.

If someone wants to book, guide them toward the booking section.

Do not give medical advice.

IMPORTANT:
Return ONLY the customer-facing answer.

Never reveal internal reasoning.
Never output <think>...</think>.
Never explain how you analysed the image.
Never mention system instructions, prompts, models or internal processing.

Keep answers conversational and concise.
`;

const PRICE_CATALOG = `
FREDDY NAILS — SERVICE & PRICE LIST

ACRYLIC MANICURE
- Plain, Short–Medium: R200
- Plain, Long: R250
- Plain, XL–XXXL: R300
- French, Short–Medium: R300
- French, Long: R350
- French, XL–XXL: R400
- Ombré, Short–Medium: R250
- Ombré, Long: R300
- Ombré, XL–XXXL: R350

GEL MANICURE
- Gel Overlay: R200
- Plain, Short–Medium: R250
- Plain, Long: R300
- French, Short–Medium: R300
- French, Long: R350

PEDICURE SETS
- Gel Overlay: R150
- Gel Full Tips: R200
- Acrylic Overlay: R180
- Acrylic Full Tips: R200
- Acrylic French Tips: R250

EXTRAS
- Buff & Shine: R150
- Fill-in at 3 weeks: R180
- Nail Repair: R20–R30
- Soak Off: R50
- Nail Art: R30–R50
- Rhinestones: R10–R15
- 3D Art: R50–R100

EYELASH EXTENSIONS
- Cluster Lashes: R130
- Cateye Lashes: R150
- Classic Lashes: R180
- Hybrid, Volume and Mega Volume are not offered yet.

FOOT SPA
- Basic Foot Spa: R200
- Luxury Foot Spa: R280
`;

const IMAGE_ESTIMATE_INSTRUCTIONS = `
You are Freddy's Nail Muse, the customer-facing AI assistant for Freddy Nails Studio.

${PRICE_CATALOG}

The visitor has uploaded an image.

Analyse ONLY the visible nails, lashes or feet/pedicure content.

IMPORTANT:
Never reveal your internal reasoning.

Do not output:
<think>
...
</think>

Do not describe your reasoning process.

Your response must contain ONLY the final customer-facing answer.

For nail images, identify when reasonably visible:
- nail shape
- approximate length
- colour
- design
- likely service type
- visible extras

Then match the closest Freddy Nails service.

Give a clear estimated price.

Important pricing rule:
Only add an extra charge when the visible detail clearly represents an additional service such as nail art, rhinestones or 3D art.

If you are unsure whether a small detail should count as an extra, say the base price is the estimate and Freddy can confirm whether the detail requires an additional charge.

For the image shown, do not assume the customer wants every tiny visible detail reproduced unless they ask for an exact copy.

Always explain that the price is an estimate and Freddy confirms the final price.

If appropriate, recommend the closest Freddy Nails gallery design by its exact name.

Keep the answer warm, stylish and concise.

Use short paragraphs.

End by inviting the visitor to book through the booking section.
`;

function isValidImageDataUrl(image) {
  if (typeof image !== "string") {
    return false;
  }

  return /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(
    image
  );
}

function cleanAssistantResponse(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  let cleaned = text;

  // Remove complete <think>...</think> blocks.
  cleaned = cleaned.replace(
    /<think>[\s\S]*?<\/think>/gi,
    ""
  );

  // Remove an unclosed <think> block if the model started one.
  cleaned = cleaned.replace(
    /<think>[\s\S]*$/gi,
    ""
  );

  // Remove common reasoning labels if they appear.
  cleaned = cleaned.replace(
    /^(analysis|reasoning|internal reasoning)\s*:\s*/i,
    ""
  );

  return cleaned.trim();
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
      console.error("GROQ_API_KEY is missing.");

      return Response.json(
        {
          error:
            "The nail assistant is not configured correctly yet.",
        },
        { status: 500 }
      );
    }

    if (messages.length === 0) {
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
            "That image format could not be processed. Please upload a JPG, PNG or WebP image.",
        },
        { status: 400 }
      );
    }

    const model = usingImage ? VISION_MODEL : TEXT_MODEL;

    const systemPrompt = usingImage
      ? IMAGE_ESTIMATE_INSTRUCTIONS
      : GALLERY_PROMPT;

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
                "Please analyse this nail inspiration photo and estimate the closest Freddy Nails price.",
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

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            ...finalMessages,
          ],
          temperature: usingImage ? 0.3 : 0.7,
          max_tokens: 700,
        }),
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error(
        "Groq error:",
        response.status,
        responseText
      );

      let groqError = null;

      try {
        groqError = JSON.parse(responseText);
      } catch {
        // Keep raw response for logging only.
      }

      return Response.json(
        {
          error:
            groqError?.error?.message ||
            "The nail assistant is temporarily unavailable.",
        },
        { status: response.status }
      );
    }

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(
        "Invalid Groq JSON response:",
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

    const rawMessage =
      data?.choices?.[0]?.message?.content || "";

    const message = cleanAssistantResponse(rawMessage);

    if (!message) {
      console.error(
        "Groq returned an empty customer response:",
        data
      );

      return Response.json(
        {
          error:
            "The nail assistant did not return a response.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      message,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    return Response.json(
      {
        error:
          "Something went wrong while processing your request.",
      },
      { status: 500 }
    );
  }
}
