"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Flame, Zap, Plus, Clock, Users, ChefHat } from "lucide-react";

// Mock data - will be fetched from Supabase by ID
const mockMeals: Record<string, {
    id: string;
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    tags: string[];
    ingredients: Array<{ item: string; qty: string; category: string }>;
    instructions: string[];
}> = {
    "1": {
        id: "1",
        name: "High-Volume Chicken Stir Fry",
        description: "Huge portion with tons of veggies - perfect when you need to feel full",
        calories: 520,
        protein: 55,
        carbs: 35,
        fats: 12,
        tags: ["high_volume", "quick_prep"],
        ingredients: [
            { item: "Chicken Breast", qty: "8 oz", category: "Meat" },
            { item: "Broccoli", qty: "2 cups", category: "Produce" },
            { item: "Bell Peppers", qty: "1 cup", category: "Produce" },
            { item: "Zucchini", qty: "1 medium", category: "Produce" },
            { item: "Mushrooms", qty: "1 cup", category: "Produce" },
            { item: "Low-sodium Soy Sauce", qty: "2 tbsp", category: "Pantry" },
            { item: "Garlic", qty: "3 cloves", category: "Produce" },
            { item: "Olive Oil", qty: "1 tsp", category: "Pantry" },
        ],
        instructions: [
            "Slice chicken breast into thin strips and season with salt and pepper.",
            "Heat olive oil in a large wok or skillet over high heat.",
            "Add chicken and cook for 5-6 minutes until browned. Remove and set aside.",
            "Add all vegetables to the hot pan. Stir fry for 4-5 minutes until crisp-tender.",
            "Add minced garlic and cook for 30 seconds until fragrant.",
            "Return chicken to the pan along with soy sauce.",
            "Toss everything together for 1-2 minutes.",
            "Serve immediately in a large bowl."
        ],
    },
    "2": {
        id: "2",
        name: "Greek Yogurt Power Bowl",
        description: "Protein-packed breakfast option",
        calories: 380,
        protein: 45,
        carbs: 30,
        fats: 8,
        tags: ["breakfast", "quick_prep"],
        ingredients: [
            { item: "Plain Greek Yogurt (0%)", qty: "1.5 cups", category: "Dairy" },
            { item: "Berries (mixed)", qty: "1/2 cup", category: "Produce" },
            { item: "Protein Powder (vanilla)", qty: "1 scoop", category: "Pantry" },
            { item: "Cinnamon", qty: "1 tsp", category: "Pantry" },
        ],
        instructions: [
            "Add Greek yogurt to a bowl.",
            "Mix in protein powder until smooth.",
            "Top with mixed berries.",
            "Sprinkle with cinnamon.",
            "Enjoy cold."
        ],
    },
    "3": {
        id: "3",
        name: "Turkey Zucchini Boats",
        description: "Low-carb, filling dinner",
        calories: 420,
        protein: 48,
        carbs: 15,
        fats: 18,
        tags: ["high_volume", "road_friendly"],
        ingredients: [
            { item: "Ground Turkey (93% lean)", qty: "8 oz", category: "Meat" },
            { item: "Large Zucchini", qty: "2", category: "Produce" },
            { item: "Diced Tomatoes", qty: "1/2 cup", category: "Produce" },
            { item: "Onion", qty: "1/4 cup diced", category: "Produce" },
            { item: "Italian Seasoning", qty: "1 tsp", category: "Pantry" },
            { item: "Mozzarella (part-skim)", qty: "2 oz", category: "Dairy" },
        ],
        instructions: [
            "Preheat oven to 400°F.",
            "Cut zucchini in half lengthwise and scoop out seeds to create boats.",
            "Brown ground turkey in a skillet with onions for 6-7 minutes.",
            "Add diced tomatoes and Italian seasoning. Cook 2-3 minutes.",
            "Fill zucchini boats with turkey mixture.",
            "Top with shredded mozzarella.",
            "Bake for 20-25 minutes until zucchini is tender.",
            "Let cool slightly before serving."
        ],
    },
    "4": {
        id: "4",
        name: "Pork Tenderloin with Massive Salad",
        description: "Lean protein with endless greens",
        calories: 480,
        protein: 52,
        carbs: 20,
        fats: 14,
        tags: ["high_volume"],
        ingredients: [
            { item: "Pork Tenderloin", qty: "8 oz", category: "Meat" },
            { item: "Mixed Greens", qty: "4 cups", category: "Produce" },
            { item: "Cucumber", qty: "1 medium", category: "Produce" },
            { item: "Cherry Tomatoes", qty: "1 cup", category: "Produce" },
            { item: "Red Onion", qty: "1/4 cup sliced", category: "Produce" },
            { item: "Balsamic Vinegar", qty: "2 tbsp", category: "Pantry" },
            { item: "Dijon Mustard", qty: "1 tsp", category: "Pantry" },
        ],
        instructions: [
            "Season pork tenderloin with salt, pepper, and garlic powder.",
            "Heat a grill pan over medium-high heat.",
            "Cook pork for 4-5 minutes per side until internal temp reaches 145°F.",
            "Let rest for 5 minutes, then slice.",
            "Build a massive salad with greens, cucumber, tomatoes, and onion.",
            "Whisk balsamic and mustard together for dressing.",
            "Top salad with sliced pork and drizzle with dressing.",
            "Season with cracked pepper to taste."
        ],
    },
};

const tagStyles: Record<string, string> = {
    high_volume: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    road_friendly: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    quick_prep: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    breakfast: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const tagLabels: Record<string, string> = {
    high_volume: "High Volume",
    road_friendly: "Road Friendly",
    quick_prep: "Quick Prep",
    breakfast: "Breakfast",
};

const categoryColors: Record<string, string> = {
    Produce: "text-green-400",
    Meat: "text-red-400",
    Dairy: "text-blue-400",
    Pantry: "text-amber-400",
};

export default function MealDetailPage() {
    const params = useParams();
    const router = useRouter();
    const mealId = params.id as string;
    const meal = mockMeals[mealId];

    if (!meal) {
        return (
            <div className="container max-w-lg mx-auto px-4 py-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Meal not found</p>
                </div>
            </div>
        );
    }

    const handleLogMeal = () => {
        // TODO: Add to food_entries in Supabase
        console.log("Logging meal:", meal);
        router.push("/log");
    };

    return (
        <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">{meal.name}</h1>
                    <p className="text-sm text-muted-foreground">{meal.description}</p>
                </div>
            </div>

            {/* Macro Card */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="py-4">
                    <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                            <Flame className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                            <p className="text-2xl font-bold">{meal.calories}</p>
                            <p className="text-xs text-muted-foreground">calories</p>
                        </div>
                        <div>
                            <Zap className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                            <p className="text-2xl font-bold">{meal.protein}g</p>
                            <p className="text-xs text-muted-foreground">protein</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold mt-6">{meal.carbs}g</p>
                            <p className="text-xs text-muted-foreground">carbs</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold mt-6">{meal.fats}g</p>
                            <p className="text-xs text-muted-foreground">fats</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tags */}
            <div className="flex gap-2 flex-wrap">
                {meal.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className={tagStyles[tag]}>
                        {tagLabels[tag] || tag}
                    </Badge>
                ))}
            </div>

            {/* Quick Log Button */}
            <Button
                onClick={handleLogMeal}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600"
            >
                <Plus className="w-4 h-4 mr-2" />
                Log This Meal
            </Button>

            <Separator className="bg-border/50" />

            {/* Ingredients */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ChefHat className="w-5 h-5 text-emerald-500" />
                        Ingredients
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {meal.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>{ing.item}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-muted-foreground">{ing.qty}</span>
                                <span className={`text-xs ${categoryColors[ing.category] || "text-muted-foreground"}`}>
                                    {ing.category}
                                </span>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        Instructions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ol className="space-y-4">
                        {meal.instructions.map((step, i) => (
                            <li key={i} className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                                    {i + 1}
                                </div>
                                <p className="text-muted-foreground pt-1">{step}</p>
                            </li>
                        ))}
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}
