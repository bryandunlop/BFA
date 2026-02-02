"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Check, Share2, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";

interface GroceryItem {
    item: string;
    qty: string;
    checked: boolean;
}

interface CategoryGroup {
    category: string;
    items: GroceryItem[];
    isExpanded: boolean;
}

// Mock data - aggregated from meal plans
const mockGroceries: CategoryGroup[] = [
    {
        category: "Meat",
        isExpanded: true,
        items: [
            { item: "Chicken Breast", qty: "3 lbs", checked: false },
            { item: "Pork Tenderloin", qty: "2 lbs", checked: false },
            { item: "Ground Turkey", qty: "1.5 lbs", checked: false },
            { item: "Beef Flank Steak", qty: "1 lb", checked: false },
        ],
    },
    {
        category: "Produce",
        isExpanded: true,
        items: [
            { item: "Broccoli", qty: "2 heads", checked: false },
            { item: "Bell Peppers", qty: "6 count", checked: false },
            { item: "Zucchini", qty: "4 medium", checked: false },
            { item: "Spinach", qty: "2 bags", checked: false },
            { item: "Cucumber", qty: "3 count", checked: false },
            { item: "Mushrooms", qty: "16 oz", checked: false },
        ],
    },
    {
        category: "Dairy",
        isExpanded: true,
        items: [
            { item: "Greek Yogurt (Plain)", qty: "32 oz", checked: false },
            { item: "Cottage Cheese", qty: "24 oz", checked: false },
            { item: "Eggs", qty: "18 count", checked: false },
        ],
    },
    {
        category: "Pantry",
        isExpanded: false,
        items: [
            { item: "Rice (Brown)", qty: "2 lbs", checked: false },
            { item: "Olive Oil", qty: "1 bottle", checked: false },
            { item: "Low-Sodium Soy Sauce", qty: "1 bottle", checked: false },
        ],
    },
];

const categoryColors: Record<string, string> = {
    Meat: "bg-red-500/20 text-red-400 border-red-500/30",
    Produce: "bg-green-500/20 text-green-400 border-green-500/30",
    Dairy: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Pantry: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default function GroceriesPage() {
    const [groceries, setGroceries] = useState<CategoryGroup[]>(mockGroceries);
    const [dateRange] = useState({ start: "Mon, Feb 3", end: "Thu, Feb 6" });

    const toggleItem = (categoryIndex: number, itemIndex: number) => {
        setGroceries((prev) => {
            const newGroceries = [...prev];
            newGroceries[categoryIndex] = {
                ...newGroceries[categoryIndex],
                items: newGroceries[categoryIndex].items.map((item, i) =>
                    i === itemIndex ? { ...item, checked: !item.checked } : item
                ),
            };
            return newGroceries;
        });
    };

    const toggleCategory = (categoryIndex: number) => {
        setGroceries((prev) => {
            const newGroceries = [...prev];
            newGroceries[categoryIndex] = {
                ...newGroceries[categoryIndex],
                isExpanded: !newGroceries[categoryIndex].isExpanded,
            };
            return newGroceries;
        });
    };

    const totalItems = groceries.reduce((acc, cat) => acc + cat.items.length, 0);
    const checkedItems = groceries.reduce(
        (acc, cat) => acc + cat.items.filter((i) => i.checked).length,
        0
    );

    const handleShare = async () => {
        const text = groceries
            .map(
                (cat) =>
                    `${cat.category}:\n${cat.items.map((i) => `  - ${i.item} (${i.qty})`).join("\n")}`
            )
            .join("\n\n");

        if (navigator.share) {
            await navigator.share({ title: "Grocery List", text });
        } else {
            await navigator.clipboard.writeText(text);
        }
    };

    return (
        <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Grocery List</h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>{dateRange.start} - {dateRange.end}</span>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                </Button>
            </div>

            {/* Progress */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Shopping Progress</span>
                        <span className="text-sm font-semibold">
                            {checkedItems} / {totalItems} items
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-300"
                            style={{ width: `${(checkedItems / totalItems) * 100}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Generate New List */}
            <Button variant="outline" className="w-full border-dashed">
                <Calendar className="w-4 h-4 mr-2" />
                Generate New List from Meal Plan
            </Button>

            {/* Grocery Categories */}
            <div className="space-y-4">
                {groceries.map((category, catIndex) => {
                    const catChecked = category.items.filter((i) => i.checked).length;

                    return (
                        <Card key={category.category} className="bg-card/50 backdrop-blur border-border/50">
                            <CardHeader
                                className="pb-2 cursor-pointer"
                                onClick={() => toggleCategory(catIndex)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={categoryColors[category.category]}>
                                            {category.category}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {catChecked} / {category.items.length}
                                        </span>
                                    </div>
                                    {category.isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    )}
                                </div>
                            </CardHeader>

                            {category.isExpanded && (
                                <CardContent className="pt-0">
                                    <div className="space-y-1">
                                        {category.items.map((item, itemIndex) => (
                                            <div
                                                key={item.item}
                                                className={`flex items-center justify-between py-2 px-3 rounded-md cursor-pointer transition-colors ${item.checked ? "bg-emerald-500/10" : "hover:bg-muted/50"
                                                    }`}
                                                onClick={() => toggleItem(catIndex, itemIndex)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${item.checked
                                                                ? "bg-emerald-500 border-emerald-500"
                                                                : "border-muted-foreground"
                                                            }`}
                                                    >
                                                        {item.checked && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className={item.checked ? "line-through text-muted-foreground" : ""}>
                                                        {item.item}
                                                    </span>
                                                </div>
                                                <span className="text-sm text-muted-foreground">{item.qty}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
