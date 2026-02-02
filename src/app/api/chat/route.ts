import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { message, caloriesRemaining, proteinRemaining } = await request.json();

        if (!message) {
            return new Response("Message is required", { status: 400 });
        }

        const systemPrompt = `You are BFA (Bryan's Fat App), a nutrition coach for a Commercial Pilot who is 6'3" and cutting weight from 250lbs to 205lbs.

**Current Status:**
- Calories Remaining Today: ${caloriesRemaining ?? "unknown"}
- Protein Still Needed Today: ${proteinRemaining ?? "unknown"}g

**Your Personality:**
- Direct, no BS, supportive but not preachy
- You understand the struggles of eating healthy while traveling
- You're practical and understand convenience matters

**Dietary Rules (NEVER SUGGEST):**
- NO Shrimp, NO Salmon, NO Olives, NO Chocolate

**General Advice Strategy:**
- Suggest modifications for restaurants or airports if relevant
- Suggest quick-prep or high-volume meals for home contexts
- Focus on practical, realistic solutions

**If Calories Are Low:**
- Push VOLUME FOODS: Pickles (near-zero cal), Cucumbers, Massive salads with light dressing
- Suggest protein-heavy options to hit protein while staying in calories
- Be encouraging but realistic

**If Protein Is Low:**
- Focus on lean protein sources: chicken breast, egg whites, greek yogurt, cottage cheese, lean beef
- Calculate how they can hit their goal

Keep responses concise and actionable. Don't lecture - help.`;

        const result = streamText({
            model: google("gemini-2.5-flash"),
            system: systemPrompt,
            messages: [{ role: "user", content: message }],
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Chat error:", error);
        return new Response("Failed to process chat", { status: 500 });
    }
}
