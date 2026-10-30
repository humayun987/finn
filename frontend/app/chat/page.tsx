"use client";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";

interface Msg { role: "user"|"assistant"; content: string; }
const SUGGESTIONS = [
  "What's material in the last 24h?",
  "Bull case for Zomato",
  "Compare TCS and Infosys margins",
  "What did HDFC Bank guide for FY26?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Ask me about any NSE-listed company — results, guidance, bull/bear case." }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    const updated: Msg[] = [...messages, { role: "user", content: msg }];
    setMessages(updated);
    setLoading(true);
    try {
      const res: any = await api.chat.send(updated);
      setMessages(prev => [...prev, { role: "assistant", content: res.response || "No response received." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Try again." }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col min-h-screen pb-36">
      <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#222] px-4 pt-safe">
        <div className="py-3">
          <h1 className="text-lg font-bold">Ask FINN</h1>
          <p className="text-xs text-[#888]">Grounded in primary sources only</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed
              ${m.role === "user" ? "bg-white text-black rounded-2xl rounded-br-sm" : "bg-[#141414] border border-[#222] text-[#e0e0e0] rounded-2xl rounded-bl-sm"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#141414] border border-[#222] rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5">
                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-[60px] left-0 right-0 z-20 max-w-md mx-auto bg-[#0A0A0A]/95 backdrop-blur-md border-t border-[#222] px-4 py-2 space-y-2">
        {messages.length <= 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => send(s)}
                className="whitespace-nowrap text-xs bg-[#141414] border border-[#222] text-[#aaa] hover:text-white px-3 py-1.5 rounded-xl flex-shrink-0">
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-center">
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about any NSE stock..." rows={1}
            className="flex-1 bg-[#141414] border border-[#333] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#555] placeholder-[#555] resize-none" />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-white text-black font-bold text-lg flex items-center justify-center disabled:opacity-30 flex-shrink-0">
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
