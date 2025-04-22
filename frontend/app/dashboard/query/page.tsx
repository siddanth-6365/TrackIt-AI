"use client";
import React, { useState, useRef, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/components/auth-provider";
import { Loader2 } from "lucide-react";
import { apiURL } from "@/lib/api";

interface ChatMessage {
    from: "user" | "bot";
    text: string;
}

export default function DashboardQueryPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const sendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user) return;
      
        const question = input.trim();
        setMessages((m) => [...m, { from: "user", text: question }]);
        setInput("");
        setLoading(true);
      
        try {
          const res = await fetch(`${apiURL}/query/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: question, user_id: user.id }),
          });
          if (!res.ok) throw new Error(await res.text());
      
          // ← pull out the new `answer` property
          const { answer } = await res.json();
      
          // show only the human‑readable answer
          setMessages((m) => [...m, { from: "bot", text: answer }]);
        } catch (err: any) {
          setMessages((m) => [
            ...m,
            { from: "bot", text: `Error: ${err.message}` },
          ]);
        } finally {
          setLoading(false);
          inputRef.current?.focus();
        }
      };
      

    return (

        <div className="space-y-6 p-4  h-[80vh]">
            <Card  className="h-full">
                <CardHeader>
                    <CardTitle>Ask Your Receipts</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col h-full min-h-0 p-0">
                    <div className="flex flex-col flex-1 min-h-0">
                        <ScrollArea className="flex-1 min-h-0 p-4">
                            <div className="flex flex-col space-y-4">
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"
                                            }`}
                                    >
                                        <div
                                            className={`max-w-[80%] px-4 py-2 rounded-lg whitespace-pre-wrap ${msg.from === "user"
                                                    ? "bg-emerald-600 text-white text-right"
                                                    : "bg-gray-100 text-gray-900 text-left"
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg inline-flex items-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Thinking...
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <form
                        onSubmit={sendMessage}
                        className="flex gap-2 border-t p-4 bg-white sticky bottom-0 z-10"
                        style={{ boxShadow: '0 -2px 8px -4px rgba(0,0,0,0.04)' }}
                    >
                        <Input
                            ref={inputRef}
                            className="flex-1"
                            placeholder="Ask something like ‘How much did I spend on food this month?’"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <Button type="submit" disabled={!input.trim() || loading}>
                            Send
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
