"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { DailyLimitReachedError } from "@/lib/api/ai";

interface ChatMessage {
  id: string;
  from: "user" | "ai";
  text: string;
}

interface LessonChatProps {
  title: string;
  subtitle?: string;
  placeholder?: string;
  onSend: (message: string) => Promise<string>;
}

export function LessonChat({ title, subtitle, placeholder = "Digite sua mensagem...", onSend }: LessonChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // scrollIntoView não existe no jsdom (ambiente de teste) — encadeado com
    // optional chaining pra não quebrar o render em vez de checar o ambiente.
    scrollRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, from: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const reply = await onSend(text);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, from: "ai", text: reply }]);
    } catch (err) {
      const errorText =
        err instanceof DailyLimitReachedError
          ? "Você atingiu o limite diário de mensagens. Volte amanhã!"
          : "Não foi possível enviar a mensagem. Tente novamente.";
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, from: "ai", text: errorText }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface">
      <div className="flex items-center gap-2.5 border-b border-cinema-border px-4 pb-3 pt-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#DA233B] to-[#FBC607]">
          <span className="text-sm">🤖</span>
        </div>
        <div>
          <div className="font-display text-sm font-bold text-cinema-text">{title}</div>
          {subtitle ? <div className="font-body text-[10px] font-bold text-cinema-muted">{subtitle}</div> : null}
        </div>
      </div>

      <div className="max-h-64 space-y-2.5 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Sparkles className="h-5 w-5 text-cinema-muted" />
            <p className="font-body text-xs font-semibold text-cinema-muted">Envie uma mensagem pra começar</p>
          </div>
        ) : (
          messages.map((message) => <ChatBubble key={message.id} message={message} />)
        )}
        {sending ? <TypingIndicator /> : null}
        <div ref={scrollRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-cinema-border p-3">
        <div className="flex flex-1 items-center rounded-xl border border-cinema-border bg-cinema-surface-alt px-3 focus-within:border-cinema-primary/40">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={sending}
            placeholder={placeholder}
            className="h-10 flex-1 bg-transparent font-body text-sm font-semibold text-cinema-text placeholder-cinema-muted outline-none disabled:opacity-60"
          />
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="flex h-10 flex-shrink-0 items-center gap-1.5 rounded-xl px-4 font-display text-xs font-bold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #2D65AE, #4799C1)", boxShadow: "0 4px 14px -4px rgba(45,101,174,0.5)" }}
        >
          Enviar
          <Send className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.from === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-md px-3.5 py-2.5" style={{ background: "linear-gradient(135deg, #2D65AE, #4799C1)" }}>
          <p className="font-body text-xs font-semibold text-white">{message.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#DA233B] to-[#FBC607]">
        <span className="text-xs">🤖</span>
      </div>
      <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-cinema-border bg-cinema-surface-alt px-3.5 py-2.5">
        <p className="font-body text-xs font-semibold text-cinema-text">{message.text}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#DA233B] to-[#FBC607]">
        <span className="text-xs">🤖</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-cinema-border bg-cinema-surface-alt px-3.5 py-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-cinema-muted" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}
