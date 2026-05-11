import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { image } = await req.json(); // Base64 image from frontend
    const API_KEY = process.env.GOOGLE_VISION_API_KEY;

    if (!API_KEY) {
      console.warn("GOOGLE_VISION_API_KEY missing. Bypassing safety check for development.");
      return NextResponse.json({ safe: true, warning: "API Key missing" });
    }

    // Call Google Vision AI
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
      {
        method: "POST",
        body: JSON.stringify({
          requests: [
            {
              image: { content: image.split(",")[1] },
              features: [{ type: "SAFE_SEARCH_DETECTION" }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
       return NextResponse.json({ safe: true, warning: "Vision API failed" });
    }

    const data = await response.json();
    const result = data.responses[0].safeSearchAnnotation;

    // Google returns: VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY
    // We block if anything is LIKELY or VERY_LIKELY
    const isRisky = 
      result.adult === "LIKELY" || result.adult === "VERY_LIKELY" ||
      result.violence === "LIKELY" || result.violence === "VERY_LIKELY" ||
      result.racy === "LIKELY" || result.racy === "VERY_LIKELY";

    return NextResponse.json({ safe: !isRisky });

  } catch (error) {
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
