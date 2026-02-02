"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Utensils, MessageCircle, Plus, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/meals", icon: Utensils, label: "Meals" },
    { href: "/log", icon: Plus, label: "Log", isAction: true },
    { href: "/progress", icon: BarChart3, label: "Progress" },
    { href: "/chat", icon: MessageCircle, label: "Coach" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    if (item.isAction) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center justify-center -mt-6"
                            >
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105 active:scale-95">
                                    <Icon className="w-6 h-6" />
                                </div>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
                                isActive
                                    ? "text-emerald-500"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
