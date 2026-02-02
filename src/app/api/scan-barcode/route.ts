import { NextRequest, NextResponse } from "next/server";

interface OpenFoodFactsProduct {
    product_name?: string;
    nutriments?: {
        "energy-kcal_100g"?: number;
        proteins_100g?: number;
        carbohydrates_100g?: number;
        fat_100g?: number;
    };
    serving_size?: string;
}

interface OpenFoodFactsResponse {
    status: number;
    product?: OpenFoodFactsProduct;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode");

    if (!barcode) {
        return NextResponse.json({ error: "Barcode is required" }, { status: 400 });
    }

    try {
        const response = await fetch(
            `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
            {
                headers: {
                    "User-Agent": "BFA Nutrition Tracker - Contact: bryandunlop1@gmail.com",
                },
            }
        );

        const data: OpenFoodFactsResponse = await response.json();

        if (data.status !== 1 || !data.product) {
            return NextResponse.json(
                { error: "Product not found", found: false },
                { status: 404 }
            );
        }

        const product = data.product;
        const nutriments = product.nutriments || {};

        // Default to per 100g values
        const result = {
            found: true,
            name: product.product_name || "Unknown Product",
            servingSize: product.serving_size || "100g",
            calories: Math.round(nutriments["energy-kcal_100g"] || 0),
            protein: Math.round(nutriments.proteins_100g || 0),
            carbs: Math.round(nutriments.carbohydrates_100g || 0),
            fats: Math.round(nutriments.fat_100g || 0),
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error("Open Food Facts API error:", error);
        return NextResponse.json(
            { error: "Failed to lookup product" },
            { status: 500 }
        );
    }
}
