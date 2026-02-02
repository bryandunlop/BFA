import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function POST(request: NextRequest) {
    try {
        const { imageData } = await request.json();

        if (!imageData) {
            return NextResponse.json(
                { error: "Image data is required" },
                { status: 400 }
            );
        }

        const prompt = `Analyze this food image and estimate the nutritional content.
    
Return ONLY a JSON object with these fields (no markdown, no explanation):
{
  "name": "descriptive name of the food/meal",
  "calories": estimated total calories (number),
  "protein": estimated protein in grams (number),
  "carbs": estimated carbs in grams (number),
  "fats": estimated fats in grams (number),
  "confidence": "high" | "medium" | "low"
}

Be realistic with portion sizes based on what you see. If you can't identify the food clearly, make your best estimate and set confidence to "low".`;

        const result = await generateText({
            model: google("gemini-2.0-flash"),
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image",
                            image: imageData,
                        },
                    ],
                },
            ],
        });

        const text = result.text;

        // Parse the JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to parse AI response");
        }

        const nutritionData = JSON.parse(jsonMatch[0]);

        return NextResponse.json({
            success: true,
            ...nutritionData,
        });
    } catch (error) {
        console.error("Food image analysis error:", error);
        return NextResponse.json(
            { error: "Failed to analyze food image" },
            { status: 500 }
        );
    }
}
