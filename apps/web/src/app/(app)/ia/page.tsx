"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Send } from "lucide-react";
import type { ContinueLearningResponse } from "@ipp/shared";
import { getContinueLearning } from "@/lib/api/catalog";
import { chatEn, DailyLimitReachedError } from "@/lib/api/ai";
import { BrandGlow } from "@/components/decorative/brand-glow";

interface ChatMessage {
  id: string;
  from: "ai" | "user";
  text: string;
}

const QUICK_REPLIES = ["I played with my friends", "I watched a movie", "I ate pizza"];

export default function IaPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <IaContent />
    </Suspense>
  );
}

function IaContent() {
  const searchParams = useSearchParams();
  const scenario = searchParams.get("scenario");

  const [continueLearning, setContinueLearning] = useState<ContinueLearningResponse | null>(null);
  const [loading, setLoading] = useState(!scenario);

  useEffect(() => {
    // Modo cenário (vindo de /conversacao) não depende de progresso de lição.
    if (scenario) return;

    let ativo = true;

    getContinueLearning()
      .then((res) => {
        if (ativo) setContinueLearning(res);
      })
      .catch(() => {
        if (ativo) setContinueLearning({ hasProgress: false });
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [scenario]);

  return (
    <div className="relative flex h-[calc(100vh-96px)] flex-col overflow-hidden">
      <BrandGlow />

      {scenario ? (
        <ChatWithScenario scenario={scenario} />
      ) : loading ? (
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <p className="font-body text-sm text-cinema-muted">Carregando…</p>
        </div>
      ) : continueLearning?.hasProgress ? (
        <ChatWithLesson lesson={continueLearning} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="relative flex h-[calc(100vh-96px)] flex-col overflow-hidden">
      <BrandGlow />
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <p className="font-body text-sm text-cinema-muted">Carregando…</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#DA233B] to-[#FBC607] shadow-lg">
        <span className="text-3xl">🤖</span>
      </div>
      <h1 className="font-display text-lg font-bold text-cinema-text">Ainda sem lição pra praticar</h1>
      <p className="mt-2 font-body text-sm text-cinema-muted">
        A Teacher Kai conversa sobre a lição que você está cursando. Escolha uma no Explorar pra começar.
      </p>
      <Link
        href="/explorar"
        className="mt-6 rounded-full bg-gradient-to-r from-cinema-primary to-cinema-primary-alt px-5 py-2.5 font-display text-sm font-bold text-white shadow-cinema-glow"
      >
        Explorar catálogo
      </Link>
    </div>
  );
}

function ChatWithLesson({ lesson }: { lesson: Extract<ContinueLearningResponse, { hasProgress: true }> }) {
  return (
    <ChatSession
      target={{ lessonId: lesson.lessonId }}
      headerTitle={lesson.lessonTitle}
      greeting={`Hi! I'm Kai, your English tutor. 👋 Ready to talk about "${lesson.lessonTitle}"?`}
    />
  );
}

function ChatWithScenario({ scenario }: { scenario: string }) {
  return (
    <ChatSession
      target={{ scenario }}
      headerTitle={scenario}
      greeting={`Hi! I'm Kai, your English tutor. 👋 Let's practice: "${scenario}"!`}
    />
  );
}

function ChatSession({
  target,
  headerTitle,
  greeting,
}: {
  target: { lessonId: string } | { scenario: string };
  headerTitle: string;
  greeting: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: "greeting", from: "ai", text: greeting }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, from: "user", text: trimmed }]);
    setInput("");
    setSending(true);

    try {
      const { reply } = await chatEn(target, trimmed);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, from: "ai", text: reply }]);
    } catch (err) {
      const errorText =
        err instanceof DailyLimitReachedError
          ? "Você já usou todas as mensagens de hoje com a Kai. Volte amanhã pra continuar praticando! 🌙"
          : "Hmm, não consegui responder agora. Tenta de novo?";
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, from: "ai", text: errorText }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <ChatHeader title={headerTitle} />

      <div className="no-scrollbar relative z-10 mx-auto w-full max-w-md flex-1 overflow-y-auto px-5 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {sending ? <TypingIndicator /> : null}
        </div>
        <div ref={scrollRef} />
      </div>

      <QuickReplies onSelect={sendMessage} disabled={sending} />
      <InputBar value={input} onChange={setInput} onSend={() => sendMessage(input)} disabled={sending} />
    </>
  );
}

function ChatHeader({ title }: { title: string }) {
  return (
    <div className="relative z-10 flex items-center gap-3 border-b border-cinema-border px-5 pb-4 pt-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#DA233B] to-[#FBC607] shadow-lg">
        <span className="text-xl">🤖</span>
      </div>
      <div className="min-w-0">
        <div className="font-display text-base font-bold leading-none text-cinema-text">Teacher Kai</div>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-green-400" />
          <span className="truncate font-body text-xs font-semibold text-cinema-muted">Praticando: {title}</span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.from === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] rounded-2xl rounded-tr-md px-4 py-3"
          style={{ background: "linear-gradient(135deg, #2D65AE, #4799C1)", boxShadow: "0 6px 20px -8px rgba(45,101,174,0.5)" }}
        >
          <p className="font-body text-sm font-semibold text-white">{message.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#DA233B] to-[#FBC607]">
        <span className="text-sm">🤖</span>
      </div>
      <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-cinema-border bg-cinema-surface px-4 py-3">
        <p className="font-body text-sm font-semibold leading-relaxed text-cinema-text">{message.text}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#DA233B] to-[#FBC607]">
        <span className="text-sm">🤖</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-cinema-border bg-cinema-surface px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-cinema-muted/60"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function QuickReplies({ onSelect, disabled }: { onSelect: (text: string) => void; disabled: boolean }) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-2">
      <div className="no-scrollbar flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {QUICK_REPLIES.map((reply) => (
          <button
            key={reply}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(reply)}
            className="flex-shrink-0 rounded-full border border-cinema-border bg-cinema-surface px-3.5 py-2 font-body text-xs font-bold text-cinema-muted transition-colors disabled:opacity-40"
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
}

function InputBar({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-3 pt-2">
      <div className="flex items-center gap-2">
        <div
          className="flex flex-1 items-center rounded-2xl px-4 transition-all"
          style={{
            backgroundColor: focused ? "#FFFFFF" : "#F7F9FC",
            border: `1px solid ${focused ? "#2D65AE66" : "#E5EAF2"}`,
            boxShadow: focused ? "0 0 0 4px rgba(45,101,174,0.1)" : "none",
          }}
        >
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            disabled={disabled}
            placeholder="Responda em inglês…"
            className="h-12 flex-1 bg-transparent font-body text-sm font-semibold text-cinema-text placeholder-cinema-muted/60 outline-none disabled:opacity-60"
          />
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #2D65AE, #4799C1)", boxShadow: "0 6px 20px -6px rgba(45,101,174,0.6)" }}
        >
          <Send className="h-4 w-4 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
