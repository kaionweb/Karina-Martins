"use client";

import { usePathname } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { AppBottomNav } from "./_components/AppBottomNav";

// Rotas que visitantes (sem conta) podem acessar — ver Parte 2 do modo
// visitante. Home fica fora de propósito: é 100% gamificação pessoal (XP,
// streak, ranking), a própria página redireciona visitante pra /explorar.
// "/games" é só a galeria (ela mesma decide, por jogo, entre jogar e pedir
// cadastro) — os outros 4 jogos NÃO entram aqui, senão dariam pra acessar
// direto pela URL sem passar pelo cadeado da galeria.
const GUEST_ALLOWED_EXACT = ["/explorar", "/games", "/games/quiz-relampago", "/games/memoria-animais"];
const GUEST_ALLOWED_PREFIXES = ["/series/"];

function isGuestAllowed(pathname: string): boolean {
  return GUEST_ALLOWED_EXACT.includes(pathname) || GUEST_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready } = useAuthGuard({ requireProfile: true, allowGuest: isGuestAllowed(pathname) });

  if (!ready) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-cinema-bg font-body text-cinema-text">
      <div className="mx-auto w-full max-w-md flex-1 pb-24 sm:max-w-2xl md:max-w-4xl lg:max-w-5xl">{children}</div>
      <AppBottomNav />
    </div>
  );
}
