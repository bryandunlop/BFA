"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingDown, Flame, Zap, Scale, Calendar } from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { getTargets, getDailyTotalsForRange, type UserTargets } from "@/lib/store";

type Period = "7" | "30" | "all";

export default function ProgressPage() {
    const [period, setPeriod] = useState<Period>("7");
    const [targets, setTargets] = useState<UserTargets | null>(null);
    const [chartData, setChartData] = useState<{ date: string; calories: number; protein: number }[]>([]);

    useEffect(() => {
        const t = getTargets();
        setTargets(t);

        // Get chart data based on period
        const days = period === "7" ? 7 : period === "30" ? 30 : 90;
        const dailyData = getDailyTotalsForRange(days);

        const formatted = dailyData.map((d) => ({
            date: new Date(d.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
            }),
            calories: d.totals.calories,
            protein: d.totals.protein,
        }));

        setChartData(formatted);
    }, [period]);

    if (!targets) {
        return (
            <div className="container max-w-lg mx-auto px-4 py-6">
                <p className="text-center text-muted-foreground">Loading...</p>
            </div>
        );
    }

    const weightHistory = targets.weightHistory || [];
    const weightChartData = weightHistory.slice(-30).map((w) => ({
        date: new Date(w.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        }),
        weight: w.weight,
    }));

    const weightLost = weightHistory.length >= 2
        ? weightHistory[0].weight - weightHistory[weightHistory.length - 1].weight
        : 0;

    return (
        <div className="container max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Progress</h1>
                <p className="text-muted-foreground text-sm">Track your journey</p>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2 justify-center">
                {(["7", "30", "all"] as Period[]).map((p) => (
                    <Button
                        key={p}
                        variant={period === p ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPeriod(p)}
                        className={period === p ? "bg-emerald-600" : ""}
                    >
                        {p === "7" ? "7 Days" : p === "30" ? "30 Days" : "All Time"}
                    </Button>
                ))}
            </div>

            {/* Weight Progress Card */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Scale className="w-4 h-4 text-emerald-500" />
                        Weight Progress
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {weightChartData.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <span className="text-3xl font-bold">{targets.currentWeight}</span>
                                    <span className="text-muted-foreground ml-1">lbs</span>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-emerald-500">
                                        <TrendingDown className="w-4 h-4" />
                                        <span className="font-semibold">{Math.abs(weightLost).toFixed(1)} lbs</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {targets.goalWeight} lbs goal
                                    </p>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={150}>
                                <LineChart data={weightChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10, fill: '#888' }}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        domain={['dataMin - 5', 'dataMax + 5']}
                                        tick={{ fontSize: 10, fill: '#888' }}
                                        width={40}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1a1a1a',
                                            border: '1px solid #333',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={{ fill: '#10b981', r: 3 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">
                            No weight data yet. Log your weight on the dashboard!
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Calories Chart */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Flame className="w-4 h-4 text-emerald-500" />
                        Daily Calories
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {chartData.some(d => d.calories > 0) ? (
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fill: '#888' }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: '#888' }}
                                    width={40}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar
                                    dataKey="calories"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">
                            No food logged yet. Start tracking your meals!
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Protein Chart */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        Daily Protein
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {chartData.some(d => d.protein > 0) ? (
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fill: '#888' }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: '#888' }}
                                    width={40}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar
                                    dataKey="protein"
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">
                            No protein data yet. Start tracking your meals!
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
