"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, MapPin, Loader2 } from "lucide-react";
import { getRemainingMacros } from "@/lib/store";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hey! I'm your BFA Coach. I know your macro targets and dietary preferences. Ask me anything - what to eat at the airport, how to hit your protein goal, or what to do when you're starving with limited calories left!",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [remaining, setRemaining] = useState({ calories: 0, protein: 0 });
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load initial
        const update = () => {
            const r = getRemainingMacros();
            setRemaining({ calories: r.calories, protein: r.protein });
        };
        update();

        // Listen for changes
        window.addEventListener("foodEntryAdded", update);
        window.addEventListener("foodEntryDeleted", update);
        return () => {
            window.removeEventListener("foodEntryAdded", update);
            window.removeEventListener("foodEntryDeleted", update);
        };
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    caloriesRemaining: remaining.calories,
                    proteinRemaining: remaining.protein,
                }),
            });

            if (!response.ok) throw new Error("Failed to get response");

            // ... strict stream consumption ...
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("No reader available");

            let assistantMessage = "";
            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                assistantMessage += chunk;

                setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                        role: "assistant",
                        content: assistantMessage,
                    };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Sorry, I had trouble responding. Please try again.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container max-w-lg mx-auto h-[calc(100vh-5rem)] flex flex-col">
            {/* Header */}
            <div className="px-4 py-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">AI Coach</h1>
                        <p className="text-muted-foreground text-sm">Get nutrition advice</p>
                    </div>
                </div>

                {/* Context Banner */}
                <div className="mt-3 flex gap-2 text-xs">
                    <Badge variant="outline" className={`border-emerald-500/50 ${remaining.calories < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {remaining.calories} cal left
                    </Badge>
                    <Badge variant="outline" className={`border-blue-500/50 ${remaining.protein < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                        {remaining.protein}g protein left
                    </Badge>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 px-4 py-4">
                <div className="space-y-4">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"
                                }`}
                        >
                            {message.role === "assistant" && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <Card
                                className={`max-w-[80%] ${message.role === "user"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-card/50 backdrop-blur border-border/50"
                                    }`}
                            >
                                <CardContent className="p-3">
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </CardContent>
                            </Card>
                            {message.role === "user" && (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === "user" && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <Card className="bg-card/50 backdrop-blur border-border/50">
                                <CardContent className="p-3">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSubmit} className="px-4 py-4 border-t border-border/50">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about nutrition..."
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
}
