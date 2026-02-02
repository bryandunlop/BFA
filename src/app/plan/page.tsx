"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChevronLeft, ChevronRight, Plus, ShoppingCart, Trash2, Calendar, CheckSquare, Square } from "lucide-react";
import { mockMeals } from "../meals/page";
import {
    getPlan,
    addMealToPlan,
    removeMealFromPlan,
    generateGroceryList,
    type WeeklyPlan,
    type PlannedMeal
} from "@/lib/plannerStore";

export default function PlannerPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [plan, setPlan] = useState<WeeklyPlan>({});
    const [selectedSlot, setSelectedSlot] = useState<{ date: string, type: 'breakfast' | 'lunch' | 'dinner' } | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [groceryList, setGroceryList] = useState<string[]>([]);
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    const refreshPlan = () => {
        setPlan(getPlan());
    };

    useEffect(() => {
        refreshPlan();
        window.addEventListener('planUpdated', refreshPlan);
        return () => window.removeEventListener('planUpdated', refreshPlan);
    }, []);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const handleAddMeal = (meal: typeof mockMeals[0]) => {
        if (!selectedSlot) return;

        const dateKey = format(selectedSlot.date, 'yyyy-MM-dd');
        const newMeal: PlannedMeal = {
            id: Math.random().toString(36).substr(2, 9),
            name: meal.name,
            type: selectedSlot.type,
            ingredients: meal.ingredients || []
        };

        addMealToPlan(dateKey, newMeal);
        setIsAddOpen(false);
        setSelectedSlot(null);
    };

    const handleRemoveMeal = (dateStr: string, mealId: string) => {
        removeMealFromPlan(dateStr, mealId);
    };

    const updateGroceryList = () => {
        // Generate list for the currently visible week
        const startStr = format(weekDays[0], 'yyyy-MM-dd');
        const list = generateGroceryList(startStr, 7);
        setGroceryList(list);
    };

    const toggleGroceryItem = (item: string) => {
        setCheckedItems(prev => ({
            ...prev,
            [item]: !prev[item]
        }));
    };

    return (
        <div className="container mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Weekly Planner</h1>
                    <p className="text-muted-foreground text-sm">Plan your success</p>
                </div>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button onClick={updateGroceryList} className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Grocery List
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Grocery List</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-4">
                            {groceryList.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No meals planned for this week yet.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {groceryList.map((item) => (
                                        <div
                                            key={item}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                            onClick={() => toggleGroceryItem(item)}
                                        >
                                            {checkedItems[item] ? (
                                                <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" />
                                            ) : (
                                                <Square className="w-5 h-5 text-muted-foreground shrink-0" />
                                            )}
                                            <span className={checkedItems[item] ? "text-muted-foreground line-through" : ""}>
                                                {item}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Week Navigator */}
            <div className="flex items-center justify-between bg-card/50 p-2 rounded-lg backdrop-blur border border-border/50">
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2 font-medium">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>

            {/* Planner Grid */}
            <div className="grid gap-4 md:grid-cols-7 sm:grid-cols-2 xs:grid-cols-1">
                {weekDays.map((date) => {
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const dayName = format(date, 'EEEE'); // Monday
                    const dayDate = format(date, 'MMM d'); // Feb 3
                    const dayMeals = plan[dateKey] || [];
                    const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;

                    return (
                        <Card key={dateKey} className={`flex flex-col h-full border-border/50 ${isToday ? 'border-emerald-500/50 bg-emerald-500/5' : 'bg-card/30'}`}>
                            <CardHeader className="py-3 px-4 border-b border-border/50">
                                <div className="text-sm font-semibold">{dayName}</div>
                                <div className="text-xs text-muted-foreground">{dayDate}</div>
                            </CardHeader>
                            <CardContent className="flex-1 p-3 space-y-3">
                                {['breakfast', 'lunch', 'dinner'].map((type) => {
                                    const meal = dayMeals.find(m => m.type === type);

                                    return (
                                        <div key={type} className="space-y-1">
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pl-1">
                                                {type}
                                            </div>

                                            {meal ? (
                                                <div className="group relative bg-background border border-border/50 rounded-md p-2 shadow-sm">
                                                    <p className="text-xs font-medium line-clamp-2">{meal.name}</p>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 rounded-full shadow-md transition-opacity"
                                                        onClick={() => handleRemoveMeal(dateKey, meal.id)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full h-8 border border-dashed border-border/50 text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                                                    onClick={() => {
                                                        setSelectedSlot({ date: dateKey, type: type as any });
                                                        setIsAddOpen(true);
                                                    }}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Add Meal Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Select a Meal</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                        {mockMeals.map((meal) => (
                            <div
                                key={meal.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => handleAddMeal(meal)}
                            >
                                <div>
                                    <p className="font-medium">{meal.name}</p>
                                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                        <span>{meal.calories} cal</span>
                                        <span>{meal.protein}g protein</span>
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" className="text-emerald-500">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
