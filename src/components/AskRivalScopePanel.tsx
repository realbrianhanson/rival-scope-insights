import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, ArrowUp, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useCompetitors } from "@/hooks/useCompetitors";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string; timestamp: Date };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-rivalscope`;

export function AskRivalScopeButton() {
  const [open, setOpen] = useState(false);
  const { data: settings } = useAppSettings();
  const appName = settings?.app_name || "RivalScope";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={`Ask ${appName}`}
        className={cn(
          "fixed bottom-20 md:bottom-8 right-6 z-40",
          "h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center",
          "shadow-[0_4px_20px_hsl(var(--primary)/0.35)] hover:shadow-glow",
          "transition-all duration-150 hover:scale-105 active:scale-95"
        )}
      >
        <Sparkles className="h-6 w-6" />
      </button>
      <AnimatePresence>
        {open && <ChatPanel onClose={() => setOpen(false)} appName={appName} />}
      </AnimatePresence>
    </>
  );
}

function ChatPanel({ onClose, appName }: { onClose: () => void; appName: string }) {
  const { user } = useAuth();
  const { data: competitors } = useCompetitors();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const firstCompName = competitors?.[0]?.name || "your top competitor";

  const suggestions = [
    "What's my biggest competitive advantage?",
    "Summarize threats from all competitors",
    `Draft a sales email positioning against ${firstCompName}`,
    "What pricing gaps can I exploit?",
    "Which competitor should I worry about most?",
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming || !user) return;
    const userMsg: Msg = { role: "user", content: text.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const conversationHistory = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          message: text.trim(),
          conversation_history: conversationHistory,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Request failed");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      const upsert = (text: string) => {
        assistantContent += text;
        const content = assistantContent;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
          }
          return [...prev, { role: "assistant", content, timestamp: new Date() }];
        });
      };

      let done = false;
      while (!done) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIdx: number;
        while ((nlIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nlIdx);
          buffer = buffer.slice(nlIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // flush remaining
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw || !raw.startsWith("data: ")) continue;
          const j = raw.slice(6).trim();
          if (j === "[DONE]") continue;
          try {
            const p = JSON.parse(j);
            const c = p.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to get AI response");
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that request. Please try again.", timestamp: new Date() }]);
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, user, messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-[#0A0A0F]/50"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] flex flex-col border-l border-[hsl(240_10%_16%)]"
        style={{ background: "#0A0A0F" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(240_10%_16%)]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-xl font-semibold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Ask {appName}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <X className="h-5 w-5 text-[#9898B0]" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
              <div className="text-center space-y-2">
                <Sparkles className="h-10 w-10 text-primary mx-auto opacity-60" />
                <p className="text-[#9898B0] text-sm">Ask anything about your competitive intelligence</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-[340px]">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-[hsl(240_10%_16%)] text-[#9898B0] hover:text-white hover:border-primary/40 transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "rounded-xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-[#1A1A26] text-white max-w-[80%]"
                    : "bg-[#12121A] border border-[#2A2A3C] text-[#E0E0E8] max-w-[90%]"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
                <p className="text-[10px] text-[#6B6B80] mt-2">{formatTime(msg.timestamp)}</p>
              </div>
            </div>
          ))}

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-[#12121A] border border-[#2A2A3C] rounded-xl px-4 py-3 flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-[hsl(240_10%_16%)]">
          <div className="flex items-center gap-2 bg-[#12121A] border border-[#2A2A3C] rounded-xl px-3 py-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your competitors..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-[#6B6B80] outline-none"
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                input.trim() && !isStreaming
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-[#6B6B80]"
              )}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
