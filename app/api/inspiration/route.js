export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return Response.json(
        { error: "Please provide a search query." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        query
      )}&per_page=6`,
      {
        headers: {
          Authorization: process.env.PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pexels error:", errorText);

      return Response.json(
        { error: "Unable to find inspiration images." },
        { status: 500 }
      );
    }

    const data = await response.json();

    const photos = (data.photos || []).map((photo) => ({
      id: photo.id,
      src: photo.src?.large || photo.src?.medium,
      alt: photo.alt || "Nail inspiration",
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      pexelsUrl: photo.url,
    }));

    return Response.json({ photos });
  } catch (error) {
    console.error("Inspiration API error:", error);

    return Response.json(
      { error: "Something went wrong while finding inspiration." },
      { status: 500 }
    );
  }
}
