import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const foodSchema = z.object({
    name: z.string().describe("Clean, formatted name of the food"),
    calories: z.number().describe("Estimated calories"),
    protein: z.number().describe("Estimated grams of protein"),
    carbs: z.number().describe("Estimated grams of carbohydrates"),
    fats: z.number().describe("Estimated grams of fat"),
});

const systemPrompt = `You are a nutrition expert. Given a food description, estimate the macros.

Be reasonably accurate based on typical serving sizes. If the user mentions a quantity, use that. Otherwise assume a reasonable portion.

Examples:
- "2 eggs" = 2 large eggs
- "chicken breast" = 6oz cooked chicken breast
- "greek yogurt" = 1 cup plain nonfat greek yogurt
- "big mac" = McDonald's Big Mac

Return your best estimate. Round to whole numbers.`;

export async function POST(request: NextRequest) {
    try {
        const { query } = await request.json();

        if (!query) {
            return NextResponse.json(
                { error: "Query is required" },
                { status: 400 }
            );
        }

        const { object } = await generateObject({
            model: google("gemini-2.5-flash"),
            schema: foodSchema,
            system: systemPrompt,
            prompt: `Estimate the macros for: ${query}`,
        });

        return NextResponse.json(object);
    } catch (error: unknown) {
        console.error("Error looking up food:", error);
        return NextResponse.json(
            { error: "Failed to estimate macros" },
            { status: 500 }
        );
    }
}
