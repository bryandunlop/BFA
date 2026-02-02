import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const mealSchema = z.object({
    name: z.string().describe("Name of the recipe"),
    description: z.string().describe("Brief description of the dish"),
    calories: z.number().describe("Total calories for the meal"),
    protein: z.number().describe("Grams of protein"),
    carbs: z.number().describe("Grams of carbohydrates"),
    fats: z.number().describe("Grams of fat"),
    tags: z.array(z.string()).describe("Tags like 'high_volume', 'road_friendly', 'quick_prep', 'breakfast'"),
    ingredients: z.array(
        z.object({
            item: z.string().describe("Ingredient name"),
            qty: z.string().describe("Quantity with unit"),
            category: z.string().describe("Category: Produce, Meat, Dairy, or Pantry"),
        })
    ).describe("List of ingredients with quantities"),
    instructions: z.array(z.string()).describe("Step-by-step cooking instructions"),
});

const systemPrompt = `You are an expert nutritionist for a 6'3" man cutting weight from 250lbs to 205lbs.

**Macro Targets (CRITICAL):**
- High Protein: Target 50-60g protein per main meal
- Moderate Fat: Keep fats reasonable
- Calorie Control: Keep meals ~400-600 calories typically

**Dietary Constraints (HARD RULES - NEVER VIOLATE):**
- FORBIDDEN: Shrimp, Salmon, Olives, Chocolate (allergies/preferences)
- ALLOWED Proteins: Chicken, Turkey, Lean Beef, Pork Tenderloin, White Fish (Halibut, Cod, Tilapia)

**Style Philosophy:**
- HIGH VOLUME: Maximize vegetables to fill the stomach with minimal calories
- Think: massive salads, tons of broccoli, cauliflower rice, zucchini noodles
- If the meal can include more veggies for volume, DO IT

**Task:** Generate a complete recipe based on the user's request. Calculate accurate macros. Tag appropriately.`;

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        const { object } = await generateObject({
            model: google("gemini-2.5-flash"),
            schema: mealSchema,
            system: systemPrompt,
            prompt: `Create a recipe for: ${prompt}`,
        });

        return NextResponse.json(object);
    } catch (error: unknown) {
        console.error("Error generating meal:", error);

        // Check if it's a rate limit error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
            return NextResponse.json(
                {
                    error: "API rate limit exceeded. Try again in a minute, or use Demo Mode.",
                    isRateLimit: true
                },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: "Failed to generate meal. Check your API key configuration." },
            { status: 500 }
        );
    }
}
