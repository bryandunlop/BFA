"use client";

import { useEffect, useState } from "react";
import { RadialChart } from "@/components/radial-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Flame, Zap, Target, TrendingDown, Trash2, Scale, Calculator, Check, X } from "lucide-react";
import {
  getTodaysEntries,
  getTodaysTotals,
  getTargets,
  deleteEntry,
  logWeight,
  type FoodEntry,
  type DailyTotals,
  type UserTargets
} from "@/lib/store";

export default function Dashboard() {
  // Data State
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [totals, setTotals] = useState<DailyTotals>({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [targets, setTargets] = useState<UserTargets | null>(null);

  // UI State
  const [isWeightLogOpen, setIsWeightLogOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");

  // Flex Macro State
  const [mealsSkipped, setMealsSkipped] = useState<{ breakfast: boolean, lunch: boolean, dinner: boolean }>({
    breakfast: false,
    lunch: false,
    dinner: false
  });

  const refreshData = () => {
    setEntries(getTodaysEntries());
    setTotals(getTodaysTotals());
    setTargets(getTargets());
  };

  useEffect(() => {
    refreshData();

    // Listen for updates from log page
    const handleUpdate = () => refreshData();
    window.addEventListener("foodEntryAdded", handleUpdate);
    window.addEventListener("foodEntryDeleted", handleUpdate);

    return () => {
      window.removeEventListener("foodEntryAdded", handleUpdate);
      window.removeEventListener("foodEntryDeleted", handleUpdate);
    };
  }, []);

  const handleDelete = (id: string) => {
    deleteEntry(id);
    refreshData();
  };

  const handleLogWeight = () => {
    const weight = parseFloat(newWeight);
    if (!isNaN(weight) && weight > 0) {
      logWeight(weight);
      setNewWeight("");
      setIsWeightLogOpen(false);
      refreshData();
    }
  };

  if (!targets) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const caloriesRemaining = targets.calories - totals.calories;
  const proteinRemaining = targets.protein - totals.protein;
  const weightToLose = targets.currentWeight - targets.goalWeight;

  // Flex Logic
  const mealsRemainingCount =
    (mealsSkipped.breakfast ? 0 : 1) +
    (mealsSkipped.lunch ? 0 : 1) +
    (mealsSkipped.dinner ? 0 : 1);

  // Simple logic: Assuming 3 main meals + snacks. 
  // If we want to redistribute remaining calories over remaining MAIN meals.
  // First, determine which meals are already "past" or "eaten"? 
  // For simplicity: The user explicitly marks a meal as "Skipped". 
  // We calculate "Recommended per remaining meal".
  // We'll count "remaining meals" as those NOT skipped.
  // Note: This is a basic flex calculator. 

  const recommendedPerMeal = mealsRemainingCount > 0
    ? Math.round(Math.max(0, caloriesRemaining) / mealsRemainingCount)
    : 0;

  return (
    <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Today&apos;s Progress</p>
      </div>

      {/* Main Macro Rings */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-around py-4">
            <RadialChart
              value={totals.calories}
              max={targets.calories}
              label="Calories"
              size="lg"
              color="emerald"
            />
            <RadialChart
              value={totals.protein}
              max={targets.protein}
              label="Protein"
              unit="g"
              size="lg"
              color="blue"
            />
          </div>

          {/* Remaining Summary */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-500" />
              <span className="text-muted-foreground">
                <span className={`font-semibold ${caloriesRemaining < 0 ? "text-red-500" : "text-foreground"}`}>
                  {caloriesRemaining}
                </span> cal left
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-muted-foreground">
                <span className={`font-semibold ${proteinRemaining < 0 ? "text-red-500" : "text-foreground"}`}>
                  {proteinRemaining}g
                </span> protein left
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flex Macros / Meal Status */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-500" />
            Flex Macros
          </CardTitle>
          <CardDescription className="text-xs">
            Skip a meal? Mark it to redistribute calories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between gap-2">
            {["breakfast", "lunch", "dinner"].map((meal) => (
              <Button
                key={meal}
                variant={mealsSkipped[meal as keyof typeof mealsSkipped] ? "destructive" : "outline"}
                size="sm"
                className={`flex-1 text-xs capitalize ${mealsSkipped[meal as keyof typeof mealsSkipped] ? "opacity-50" : ""}`}
                onClick={() => setMealsSkipped(prev => ({
                  ...prev,
                  [meal]: !prev[meal as keyof typeof mealsSkipped]
                }))}
              >
                {mealsSkipped[meal as keyof typeof mealsSkipped] ? "Skipped" : meal}
              </Button>
            ))}
          </div>

          <div className="p-3 bg-muted/30 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Recommended for next meals</p>
            <p className="text-xl font-bold text-emerald-500">
              ~{recommendedPerMeal} <span className="text-sm font-normal text-muted-foreground">cal/meal</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Weight Goal */}
      <Card className="bg-card/50 backdrop-blur border-border/50 transition-all">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-500" />
              Weight Tracker
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setIsWeightLogOpen(!isWeightLogOpen)}
            >
              Log Weight
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-bold">{targets.currentWeight}</span>
              <span className="text-muted-foreground ml-1">lbs</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingDown className="w-4 h-4 text-emerald-500" />
              <span>{weightToLose} lbs to go</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-semibold text-emerald-500">{targets.goalWeight}</span>
              <span className="text-muted-foreground ml-1 text-sm">goal</span>
            </div>
          </div>

          {isWeightLogOpen && (
            <div className="mt-4 flex gap-2 animate-in slide-in-from-top-2">
              <Input
                type="number"
                placeholder="Enter current weight..."
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
              />
              <Button onClick={handleLogWeight} disabled={!newWeight} className="bg-emerald-600">
                Save
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Meals */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Today&apos;s Meals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No meals logged yet today
            </p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="font-medium">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.timestamp}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold">{entry.calories} cal</p>
                    <p className="text-xs text-blue-500">{entry.protein}g protein</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
