"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, ChefHat, Flame, Zap, Plus, Check, AlertTriangle, RefreshCw, Send } from "lucide-react";
import { saveRecipe } from "@/lib/recipeStore";

interface GeneratedMeal {
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    tags: string[];
    ingredients: Array<{ item: string; qty: string; category: string }>;
    instructions: string[];
}

export default function GenerateMealPage() {
    const [prompt, setPrompt] = useState("");
    const [refinementPrompt, setRefinementPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [generatedMeal, setGeneratedMeal] = useState<GeneratedMeal | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsLoading(true);
        setGeneratedMeal(null);
        setIsSaved(false);
        setError(null);

        try {
            const response = await fetch("/api/generate-meal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to generate meal");
                return;
            }

            setGeneratedMeal(data);
        } catch (err) {
            console.error("Error generating meal:", err);
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefine = async (quickPrompt?: string) => {
        const promptText = typeof quickPrompt === "string" ? quickPrompt : refinementPrompt;
        if (!promptText.trim() || !generatedMeal) return;

        setIsRefining(true);
        setError(null);
        setIsSaved(false);
        if (quickPrompt) setRefinementPrompt(quickPrompt);

        try {
            // Build a prompt that includes the current recipe and the refinement request
            const fullPrompt = `
I have this existing recipe:
Name: ${generatedMeal.name}
Description: ${generatedMeal.description}
Calories: ${generatedMeal.calories}, Protein: ${generatedMeal.protein}g, Carbs: ${generatedMeal.carbs}g, Fat: ${generatedMeal.fats}g

Ingredients:
${generatedMeal.ingredients.map(ing => `- ${ing.qty} ${ing.item}`).join("\n")}

Instructions:
${generatedMeal.instructions.map((step, i) => `${i + 1}. ${step}`).join("\n")}

Please modify this recipe based on the following request: ${refinementPrompt}

Keep the same general structure but apply the requested changes. Recalculate macros if ingredients change.
`;

            const response = await fetch("/api/generate-meal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: fullPrompt }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to refine meal");
                return;
            }

            setGeneratedMeal(data);
            setRefinementPrompt("");
        } catch (err) {
            console.error("Error refining meal:", err);
            setError("Network error. Please try again.");
        } finally {
            setIsRefining(false);
        }
    };

    const handleSave = async () => {
        if (!generatedMeal) return;

        saveRecipe({
            name: generatedMeal.name,
            description: generatedMeal.description,
            calories: generatedMeal.calories,
            protein: generatedMeal.protein,
            carbs: generatedMeal.carbs,
            fats: generatedMeal.fats,
            tags: generatedMeal.tags,
            ingredients: generatedMeal.ingredients,
            instructions: generatedMeal.instructions
        });

        setIsSaved(true);
    };

    const categoryColors: Record<string, string> = {
        Produce: "text-green-400",
        Meat: "text-red-400",
        Dairy: "text-blue-400",
        Pantry: "text-amber-400",
    };

    const quickRefinements = [
        "More protein",
        "Less carbs",
        "Add more veggies",
        "Make it spicier",
        "Simpler prep",
    ];

    return (
        <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 mb-4">
                    <ChefHat className="w-8 h-8 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold">AI Chef</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Describe what you want, then refine until it's perfect
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="py-4 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Initial Prompt Input - only show if no recipe yet */}
            {!generatedMeal && (
                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardContent className="pt-6 space-y-4">
                        <Textarea
                            placeholder="e.g., Make me a high-protein pork stir fry with lots of vegetables"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="min-h-[100px] resize-none"
                        />
                        <Button
                            onClick={handleGenerate}
                            disabled={isLoading || !prompt.trim()}
                            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate Recipe
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Generated Recipe */}
            {generatedMeal && (
                <>
                    <Card className="bg-card/50 backdrop-blur border-border/50">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-xl">{generatedMeal.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">{generatedMeal.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setGeneratedMeal(null);
                                            setPrompt("");
                                            setIsSaved(false);
                                        }}
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={isSaved}
                                        className={isSaved ? "bg-emerald-600" : "bg-gradient-to-r from-emerald-500 to-emerald-600"}
                                    >
                                        {isSaved ? (
                                            <>
                                                <Check className="w-4 h-4 mr-1" />
                                                Saved
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4 mr-1" />
                                                Save
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Macros */}
                            <div className="grid grid-cols-4 gap-2 p-4 rounded-lg bg-muted/30">
                                <div className="text-center">
                                    <Flame className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                                    <p className="text-lg font-bold">{generatedMeal.calories}</p>
                                    <p className="text-xs text-muted-foreground">calories</p>
                                </div>
                                <div className="text-center">
                                    <Zap className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                    <p className="text-lg font-bold">{generatedMeal.protein}g</p>
                                    <p className="text-xs text-muted-foreground">protein</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold mt-6">{generatedMeal.carbs}g</p>
                                    <p className="text-xs text-muted-foreground">carbs</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold mt-6">{generatedMeal.fats}g</p>
                                    <p className="text-xs text-muted-foreground">fats</p>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex gap-2 flex-wrap">
                                {generatedMeal.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                        {tag.replace("_", " ")}
                                    </Badge>
                                ))}
                            </div>

                            {/* Ingredients */}
                            <div>
                                <h3 className="font-semibold mb-3">Ingredients</h3>
                                <div className="space-y-2">
                                    {generatedMeal.ingredients.map((ing, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <span>{ing.item}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">{ing.qty}</span>
                                                <span className={`text-xs ${categoryColors[ing.category] || "text-muted-foreground"}`}>
                                                    {ing.category}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Instructions */}
                            <div>
                                <h3 className="font-semibold mb-3">Instructions</h3>
                                <ol className="space-y-2">
                                    {generatedMeal.instructions.map((step, i) => (
                                        <li key={i} className="text-sm flex gap-3">
                                            <span className="font-semibold text-emerald-500 shrink-0">{i + 1}.</span>
                                            <span className="text-muted-foreground">{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Refinement Section */}
                    <Card className="bg-card/50 backdrop-blur border-border/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-emerald-500" />
                                Refine Recipe
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Quick Refinement Buttons */}
                            <div className="flex gap-2 flex-wrap">
                                {quickRefinements.map((text) => (
                                    <Button
                                        key={text}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRefine(text)}
                                        disabled={isRefining}
                                        className="text-xs"
                                    >
                                        {text}
                                    </Button>
                                ))}
                            </div>

                            {/* Custom Refinement Input */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="How would you like to modify this recipe?"
                                    value={refinementPrompt}
                                    onChange={(e) => setRefinementPrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !isRefining) {
                                            handleRefine();
                                        }
                                    }}
                                    disabled={isRefining}
                                />
                                <Button
                                    id="refine-btn"
                                    onClick={() => handleRefine()}
                                    disabled={isRefining || !refinementPrompt.trim()}
                                    className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                                >
                                    {isRefining ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
