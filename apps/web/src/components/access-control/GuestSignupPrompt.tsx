import Link from "next/link";
import { UserPlus } from "lucide-react";

// Convite de cadastro ao fim de uma sessão de jogo como visitante (Parte 2,
// modo visitante) — não trava nada, só oferece salvar o que já foi jogado.
// Como o jogo não tem persistência no servidor (ver highscore.ts), "salvar
// progresso" aqui é o high score local do navegador, que já sobrevive ao
// cadastro (localStorage não é limpo no signup).
export function GuestSignupPrompt() {
  return (
    <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-cinema-primary/25 bg-cinema-primary/5 p-4 text-center">
      <UserPlus className="h-5 w-5 text-cinema-primary" />
      <p className="font-body text-xs font-bold text-cinema-text">Crie uma conta pra salvar esse progresso</p>
      <Link
        href="/register"
        className="mt-1 rounded-full bg-cinema-primary px-4 py-2 font-display text-xs font-bold text-white"
      >
        Criar conta grátis
      </Link>
    </div>
  );
}
