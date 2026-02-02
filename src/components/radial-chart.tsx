"use client";

import { cn } from "@/lib/utils";

interface RadialChartProps {
    value: number;
    max: number;
    label: string;
    unit?: string;
    size?: "sm" | "md" | "lg";
    color?: "emerald" | "blue" | "amber" | "rose";
}

const sizeMap = {
    sm: { container: "w-24 h-24", stroke: 8, text: "text-lg", label: "text-xs" },
    md: { container: "w-32 h-32", stroke: 10, text: "text-2xl", label: "text-sm" },
    lg: { container: "w-40 h-40", stroke: 12, text: "text-3xl", label: "text-base" },
};

const colorMap = {
    emerald: { gradient: "from-emerald-400 to-emerald-600", text: "text-emerald-500" },
    blue: { gradient: "from-blue-400 to-blue-600", text: "text-blue-500" },
    amber: { gradient: "from-amber-400 to-amber-600", text: "text-amber-500" },
    rose: { gradient: "from-rose-400 to-rose-600", text: "text-rose-500" },
};

export function RadialChart({
    value,
    max,
    label,
    unit = "",
    size = "md",
    color = "emerald",
}: RadialChartProps) {
    const percentage = Math.min((value / max) * 100, 100);
    const { container, stroke, text, label: labelSize } = sizeMap[size];
    const { gradient, text: textColor } = colorMap[color];

    // SVG circle calculations
    const radius = 50 - stroke / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className={cn("relative flex items-center justify-center", container)}>
            {/* Background circle */}
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={stroke}
                    className="text-muted/30"
                />
                {/* Progress circle with gradient */}
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" className={cn("stop-color-current", gradient.split(" ")[0].replace("from-", "text-"))} style={{ stopColor: color === "emerald" ? "#34d399" : color === "blue" ? "#60a5fa" : color === "amber" ? "#fbbf24" : "#fb7185" }} />
                        <stop offset="100%" className={cn("stop-color-current", gradient.split(" ")[1].replace("to-", "text-"))} style={{ stopColor: color === "emerald" ? "#059669" : color === "blue" ? "#2563eb" : color === "amber" ? "#d97706" : "#e11d48" }} />
                    </linearGradient>
                </defs>
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={`url(#gradient-${color})`}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500 ease-out"
                />
            </svg>

            {/* Center content */}
            <div className="flex flex-col items-center justify-center z-10">
                <span className={cn("font-bold", text, textColor)}>
                    {value}
                    {unit && <span className="text-sm font-normal ml-0.5">{unit}</span>}
                </span>
                <span className={cn("text-muted-foreground", labelSize)}>{label}</span>
                <span className={cn("text-muted-foreground/60", "text-xs")}>/ {max}</span>
            </div>
        </div>
    );
}
