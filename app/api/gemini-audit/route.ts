import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6KpiOG4Llp7seoGlGD-KDn0mB8j4yLBhyWhUrWvizlJXA";
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `You are an industrial injection molding vision classifier.
Inspect the uploaded product image and return ONLY valid JSON with these exact keys:
{
  "product_name": "Physical object name ONLY, e.g. 'Bottle Cap / Closure' or 'Earphone Charging Case'. Do NOT include any resin or material name.",
  "product_type": "Choose strictly from: packaging_closure | food_container | electronics_enclosure | toy | automotive_part | medical | household | consumer_general",
  "confidence": "high | medium | low",
  "visible_features": ["List 2 to 4 features directly observable in the photo, e.g. threads, knurling, hinge pocket, tamper band."]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/jpeg", data: base64Data } }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1
          }
        })
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Gemini API failed" }, { status: 500 });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return NextResponse.json(JSON.parse(rawText));
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}