"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Flame, Zap, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSavedRecipes, type SavedRecipe } from "@/lib/recipeStore";
import { addEntry } from "@/lib/store";

// Mock meal data - will be replaced with Supabase data
export const mockMeals = [
    {
        id: "1",
        name: "High-Volume Chicken Stir Fry",
        description: "Huge portion with tons of veggies",
        calories: 520,
        protein: 55,
        carbs: 35,
        fats: 12,
        tags: ["high_volume", "quick_prep"],
        ingredients: ["Chicken Breast", "Broccoli", "Bell Peppers", "Soy Sauce", "Cauliflower Rice"],
    },
    {
        id: "2",
        name: "Greek Yogurt Power Bowl",
        description: "Protein-packed breakfast option",
        calories: 380,
        protein: 45,
        carbs: 30,
        fats: 8,
        tags: ["breakfast", "quick_prep"],
        ingredients: ["Greek Yogurt", "Berries", "Protein Powder", "Almonds"],
    },
    {
        id: "3",
        name: "Turkey Zucchini Boats",
        description: "Low-carb, filling dinner",
        calories: 420,
        protein: 48,
        carbs: 15,
        fats: 18,
        tags: ["high_volume", "road_friendly"],
        ingredients: ["Ground Turkey", "Zucchini", "Marinara Sauce", "Mozzarella", "Italian Seasoning"],
    },
    {
        id: "4",
        name: "Pork Tenderloin with Massive Salad",
        description: "Lean protein with endless greens",
        calories: 480,
        protein: 52,
        carbs: 20,
        fats: 14,
        tags: ["high_volume"],
        ingredients: ["Pork Tenderloin", "Mixed Greens", "Cucumber", "Tomatoes", "Balsamic Dressing"],
    },
];

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



// ... existing imports ...

export default function MealsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [recipes, setRecipes] = useState<any[]>(mockMeals);

    const loadRecipes = () => {
        const saved = getSavedRecipes();
        setRecipes([...mockMeals, ...saved]);
    };

    useEffect(() => {
        loadRecipes();
        // Listen for updates
        window.addEventListener("recipeSaved", loadRecipes);
        window.addEventListener("recipeDeleted", loadRecipes);
        return () => {
            window.removeEventListener("recipeSaved", loadRecipes);
            window.removeEventListener("recipeDeleted", loadRecipes);
        };
    }, []);

    const filteredRecipes = recipes.filter(meal =>
        meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meal.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Meal Bank</h1>
                    <p className="text-muted-foreground text-sm">Your saved recipes</p>
                </div>
                <Link href="/meals/generate">
                    <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Chef
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search meals..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Panic Button - High Volume Filter */}
            <Button
                variant="outline"
                className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
                <Flame className="w-4 h-4 mr-2" />
                🚨 Hunger Panic Mode - Show High Volume Only
            </Button>

            {/* Tag Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                {Object.entries(tagLabels).map(([key, label]) => (
                    <Badge
                        key={key}
                        variant="outline"
                        className={`shrink-0 cursor-pointer hover:opacity-80 ${tagStyles[key]}`}
                    >
                        {label}
                    </Badge>
                ))}
            </div>

            {/* Meal Cards */}
            <div className="space-y-4">
                {filteredRecipes.map((meal) => (
                    <Link key={meal.id} href={`/meals/${meal.id}`}>
                        <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/70 transition-colors cursor-pointer">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg">{meal.name}</CardTitle>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            addEntry({
                                                name: meal.name,
                                                calories: meal.calories,
                                                protein: meal.protein,
                                                carbs: meal.carbs,
                                                fats: meal.fats,
                                                mealType: "snack" // Default to snack, or could ask user. For speed: snack/mixed.
                                            });
                                            // Optional: Show toast
                                        }}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">{meal.description}</p>
                            </CardHeader>
                            <CardContent>
                                {/* Macros */}
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="flex items-center gap-1">
                                        <Flame className="w-4 h-4 text-emerald-500" />
                                        <span className="font-semibold">{meal.calories}</span>
                                        <span className="text-xs text-muted-foreground">cal</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Zap className="w-4 h-4 text-blue-500" />
                                        <span className="font-semibold">{meal.protein}g</span>
                                        <span className="text-xs text-muted-foreground">protein</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        C: {meal.carbs}g | F: {meal.fats}g
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="flex gap-2 flex-wrap">
                                    {meal.tags.map((tag: string) => (
                                        <Badge key={tag} variant="outline" className={`text-xs ${tagStyles[tag] || "bg-muted text-muted-foreground"}`}>
                                            {tagLabels[tag] || tag.replace(/_/g, " ")}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
