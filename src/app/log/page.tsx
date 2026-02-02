"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Flame, Zap, Search, Loader2, Check, Sparkles, Camera, ScanBarcode } from "lucide-react";
import { addEntry, getTodaysTotals, type DailyTotals } from "@/lib/store";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { PhotoCapture } from "@/components/photo-capture";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface QuickMeal {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

const quickMeals: QuickMeal[] = [
    { name: "Chicken Breast (6oz)", calories: 280, protein: 52, carbs: 0, fats: 6 },
    { name: "Greek Yogurt (1 cup)", calories: 130, protein: 22, carbs: 8, fats: 0 },
    { name: "Beef Jerky (2oz)", calories: 160, protein: 26, carbs: 6, fats: 3 },
    { name: "Hard Boiled Eggs (2)", calories: 140, protein: 12, carbs: 1, fats: 10 },
    { name: "Cottage Cheese (1 cup)", calories: 220, protein: 28, carbs: 8, fats: 8 },
    { name: "Turkey Slices (4oz)", calories: 120, protein: 24, carbs: 2, fats: 1 },
];

export default function LogPage() {
    const [mealType, setMealType] = useState<MealType>("lunch");
    const [todaysTotals, setTodaysTotals] = useState<DailyTotals>({ calories: 0, protein: 0, carbs: 0, fats: 0 });
    const [justAdded, setJustAdded] = useState<string | null>(null);
    const [aiQuery, setAiQuery] = useState("");
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
    const [isScanningBarcode, setIsScanningBarcode] = useState(false);
    const [manualEntry, setManualEntry] = useState({
        name: "",
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
    });

    // Load today's totals on mount
    useEffect(() => {
        setTodaysTotals(getTodaysTotals());
    }, []);

    const refreshTotals = () => {
        setTodaysTotals(getTodaysTotals());
    };

    const showAddedFeedback = (name: string) => {
        setJustAdded(name);
        setTimeout(() => setJustAdded(null), 2000);
    };

    const handleQuickAdd = (meal: QuickMeal) => {
        addEntry({
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
            mealType,
        });
        refreshTotals();
        showAddedFeedback(meal.name);
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualEntry.name.trim()) return;

        addEntry({
            name: manualEntry.name,
            calories: parseInt(manualEntry.calories) || 0,
            protein: parseInt(manualEntry.protein) || 0,
            carbs: parseInt(manualEntry.carbs) || 0,
            fats: parseInt(manualEntry.fats) || 0,
            mealType,
        });

        refreshTotals();
        showAddedFeedback(manualEntry.name);
        setManualEntry({ name: "", calories: "", protein: "", carbs: "", fats: "" });
    };

    const handleAiLookup = async () => {
        if (!aiQuery.trim()) return;

        setIsLookingUp(true);
        try {
            const response = await fetch("/api/lookup-food", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: aiQuery }),
            });

            if (response.ok) {
                const data = await response.json();
                setManualEntry({
                    name: data.name,
                    calories: String(data.calories),
                    protein: String(data.protein),
                    carbs: String(data.carbs),
                    fats: String(data.fats),
                });
                setAiQuery("");
            }
        } catch (error) {
            console.error("AI lookup failed:", error);
        } finally {
            setIsLookingUp(false);
        }
    };

    const handleBarcodeScan = async (barcode: string) => {
        setIsScanningBarcode(true);
        try {
            const response = await fetch(`/api/scan-barcode?barcode=${barcode}`);
            const data = await response.json();

            if (data.found) {
                setManualEntry({
                    name: data.name,
                    calories: String(data.calories),
                    protein: String(data.protein),
                    carbs: String(data.carbs),
                    fats: String(data.fats),
                });
            } else {
                // Product not found - could show a toast here
                console.log("Product not found in database");
            }
        } catch (error) {
            console.error("Barcode lookup failed:", error);
        } finally {
            setIsScanningBarcode(false);
        }
    };

    const handlePhotoCapture = async (imageData: string) => {
        setIsAnalyzingPhoto(true);
        try {
            const response = await fetch("/api/analyze-food-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageData }),
            });

            if (response.ok) {
                const data = await response.json();
                setManualEntry({
                    name: data.name,
                    calories: String(data.calories),
                    protein: String(data.protein),
                    carbs: String(data.carbs),
                    fats: String(data.fats),
                });
            }
        } catch (error) {
            console.error("Photo analysis failed:", error);
        } finally {
            setIsAnalyzingPhoto(false);
        }
    };

    return (
        <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
            {/* Header with Today's Total */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Log Food</h1>
                    <p className="text-muted-foreground text-sm">Track what you eat</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 text-sm">
                        <Flame className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold">{todaysTotals.calories}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold">{todaysTotals.protein}g</span>
                    </div>
                </div>
            </div>

            {/* Added Feedback */}
            {justAdded && (
                <Card className="bg-emerald-500/10 border-emerald-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CardContent className="py-3 flex items-center gap-3">
                        <Check className="w-5 h-5 text-emerald-400" />
                        <p className="text-sm text-emerald-400">
                            Added <span className="font-semibold">{justAdded}</span>
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Meal Type Selector */}
            <div className="flex gap-2 justify-center">
                {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((type) => (
                    <Button
                        key={type}
                        variant={mealType === type ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMealType(type)}
                        className={mealType === type ? "bg-emerald-600" : ""}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                ))}
            </div>

            <Tabs defaultValue="ai" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="ai" className="text-xs">AI</TabsTrigger>
                    <TabsTrigger value="photo" className="text-xs">Photo</TabsTrigger>
                    <TabsTrigger value="scan" className="text-xs">Scan</TabsTrigger>
                    <TabsTrigger value="quick" className="text-xs">Quick</TabsTrigger>
                    <TabsTrigger value="manual" className="text-xs">Manual</TabsTrigger>
                </TabsList>

                {/* AI Lookup Tab */}
                <TabsContent value="ai" className="space-y-4 mt-4">
                    <Card className="bg-card/50 backdrop-blur border-border/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-emerald-500" />
                                AI Food Lookup
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Type what you ate and I&apos;ll estimate the macros
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g., grilled cheese sandwich..."
                                    value={aiQuery}
                                    onChange={(e) => setAiQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !isLookingUp) {
                                            handleAiLookup();
                                        }
                                    }}
                                    disabled={isLookingUp}
                                />
                                <Button
                                    onClick={handleAiLookup}
                                    disabled={isLookingUp || !aiQuery.trim()}
                                    className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                                >
                                    {isLookingUp ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>

                            {/* Show pre-filled form if AI returned results */}
                            {manualEntry.name && (
                                <div className="mt-4 p-4 rounded-lg bg-muted/30 space-y-3">
                                    <p className="font-medium">{manualEntry.name}</p>
                                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                                        <div>
                                            <p className="font-bold text-emerald-500">{manualEntry.calories}</p>
                                            <p className="text-xs text-muted-foreground">cal</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-blue-500">{manualEntry.protein}g</p>
                                            <p className="text-xs text-muted-foreground">protein</p>
                                        </div>
                                        <div>
                                            <p className="font-bold">{manualEntry.carbs}g</p>
                                            <p className="text-xs text-muted-foreground">carbs</p>
                                        </div>
                                        <div>
                                            <p className="font-bold">{manualEntry.fats}g</p>
                                            <p className="text-xs text-muted-foreground">fats</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            handleManualSubmit({ preventDefault: () => { } } as React.FormEvent);
                                        }}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Log This
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Photo Tab */}
                <TabsContent value="photo" className="space-y-4 mt-4">
                    <Card className="bg-card/50 backdrop-blur border-border/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Camera className="w-5 h-5 text-emerald-500" />
                                Photo Logging
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isAnalyzingPhoto ? (
                                <div className="text-center py-8 space-y-4">
                                    <Loader2 className="w-12 h-12 text-emerald-500 mx-auto animate-spin" />
                                    <p className="text-muted-foreground">Analyzing your food...</p>
                                </div>
                            ) : manualEntry.name ? (
                                <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                                    <p className="font-medium">{manualEntry.name}</p>
                                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                                        <div>
                                            <p className="font-bold text-emerald-500">{manualEntry.calories}</p>
                                            <p className="text-xs text-muted-foreground">cal</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-blue-500">{manualEntry.protein}g</p>
                                            <p className="text-xs text-muted-foreground">protein</p>
                                        </div>
                                        <div>
                                            <p className="font-bold">{manualEntry.carbs}g</p>
                                            <p className="text-xs text-muted-foreground">carbs</p>
                                        </div>
                                        <div>
                                            <p className="font-bold">{manualEntry.fats}g</p>
                                            <p className="text-xs text-muted-foreground">fats</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            handleManualSubmit({ preventDefault: () => { } } as React.FormEvent);
                                        }}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Log This
                                    </Button>
                                </div>
                            ) : (
                                <PhotoCapture onCapture={handlePhotoCapture} />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Scan Tab */}
                <TabsContent value="scan" className="space-y-4 mt-4">
                    <Card className="bg-card/50 backdrop-blur border-border/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ScanBarcode className="w-5 h-5 text-emerald-500" />
                                Barcode Scanner
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isScanningBarcode ? (
                                <div className="text-center py-8 space-y-4">
                                    <Loader2 className="w-12 h-12 text-emerald-500 mx-auto animate-spin" />
                                    <p className="text-muted-foreground">Looking up product...</p>
                                </div>
                            ) : manualEntry.name ? (
                                <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                                    <p className="font-medium">{manualEntry.name}</p>
                                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                                        <div>
                                            <p className="font-bold text-emerald-500">{manualEntry.calories}</p>
                                            <p className="text-xs text-muted-foreground">cal</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-blue-500">{manualEntry.protein}g</p>
                                            <p className="text-xs text-muted-foreground">protein</p>
                                        </div>
                                        <div>
                                            <p className="font-bold">{manualEntry.carbs}g</p>
                                            <p className="text-xs text-muted-foreground">carbs</p>
                                        </div>
                                        <div>
                                            <p className="font-bold">{manualEntry.fats}g</p>
                                            <p className="text-xs text-muted-foreground">fats</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            handleManualSubmit({ preventDefault: () => { } } as React.FormEvent);
                                        }}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Log This
                                    </Button>
                                </div>
                            ) : (
                                <BarcodeScanner onScan={handleBarcodeScan} />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Quick Add Tab */}
                <TabsContent value="quick" className="space-y-4 mt-4">
                    <div className="grid gap-3">
                        {quickMeals.map((meal, index) => (
                            <Card
                                key={index}
                                className="bg-card/50 backdrop-blur border-border/50 cursor-pointer hover:bg-card/70 transition-colors"
                                onClick={() => handleQuickAdd(meal)}
                            >
                                <CardContent className="py-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{meal.name}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Flame className="w-3 h-3 text-emerald-500" />
                                                {meal.calories}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Zap className="w-3 h-3 text-blue-500" />
                                                {meal.protein}g
                                            </span>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-emerald-500">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Manual Entry Tab */}
                <TabsContent value="manual" className="mt-4">
                    <Card className="bg-card/50 backdrop-blur border-border/50">
                        <CardHeader>
                            <CardTitle className="text-lg">Manual Entry</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleManualSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Food Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Grilled Chicken"
                                        value={manualEntry.name}
                                        onChange={(e) => setManualEntry({ ...manualEntry, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="calories">Calories</Label>
                                        <Input
                                            id="calories"
                                            type="number"
                                            placeholder="0"
                                            value={manualEntry.calories}
                                            onChange={(e) => setManualEntry({ ...manualEntry, calories: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="protein">Protein (g)</Label>
                                        <Input
                                            id="protein"
                                            type="number"
                                            placeholder="0"
                                            value={manualEntry.protein}
                                            onChange={(e) => setManualEntry({ ...manualEntry, protein: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="carbs">Carbs (g)</Label>
                                        <Input
                                            id="carbs"
                                            type="number"
                                            placeholder="0"
                                            value={manualEntry.carbs}
                                            onChange={(e) => setManualEntry({ ...manualEntry, carbs: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fats">Fats (g)</Label>
                                        <Input
                                            id="fats"
                                            type="number"
                                            placeholder="0"
                                            value={manualEntry.fats}
                                            onChange={(e) => setManualEntry({ ...manualEntry, fats: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Entry
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
