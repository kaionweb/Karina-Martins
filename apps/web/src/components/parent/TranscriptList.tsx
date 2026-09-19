import type { AiSessionTranscript } from "@ipp/shared";

interface TranscriptListProps {
  sessions: AiSessionTranscript[];
  className?: string;
}

export function TranscriptList({ sessions, className }: TranscriptListProps) {
  if (sessions.length === 0) {
    return <p style={{ color: "hsl(var(--muted-foreground))" }}>Nenhuma conversa registrada ainda.</p>;
  }

  return (
    <div className={className ?? "flex flex-col gap-6"}>
      {sessions.map((session) => (
        <article
          key={session.id}
          className="flex flex-col gap-3 rounded-lg border p-4"
          style={{
            backgroundColor: "hsl(var(--card))",
            color: "hsl(var(--card-foreground))",
            borderColor: "hsl(var(--border))",
          }}
        >
          <header className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold">
              {session.language === "EN" ? "Chat em inglês" : "Assistente em português"}
              {session.lessonTitle ? ` · ${session.lessonTitle}` : ""}
            </span>
            <span style={{ color: "hsl(var(--muted-foreground))" }}>
              {new Date(session.createdAt).toLocaleString("pt-BR")}
            </span>
          </header>

          <ul className="flex flex-col gap-2">
            {session.messages.map((message) => (
              <li
                key={message.id}
                className="rounded-md border p-3"
                style={{
                  backgroundColor: message.role === "user" ? "hsl(var(--muted))" : "hsl(var(--accent))",
                  color: "hsl(var(--foreground))",
                  borderColor: "hsl(var(--border))",
                }}
              >
                <p className="mb-1 text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {message.role === "user" ? "Criança" : "IA"}
                  {message.flaggedByFilter ? " · conteúdo filtrado" : ""}
                </p>
                <p>{message.content}</p>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
