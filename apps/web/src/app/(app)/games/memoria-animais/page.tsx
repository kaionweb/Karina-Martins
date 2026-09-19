"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Brain, RotateCcw, Trophy } from "lucide-react";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";
import { GuestSignupPrompt } from "@/components/access-control/GuestSignupPrompt";
import { useProfileStore } from "@/stores/useProfileStore";
import { getHighScore, saveHighScoreIfBetter } from "@/lib/games/highscore";
import { LEVEL_STYLES, type Nivel } from "@/lib/ui/levelStyles";

const GAME_ID = "g2";
const LEVEL_ORDER: Nivel[] = ["Básico", "Intermediário", "Avançado"];

interface Animal {
  id: string;
  word: string;
  emoji: string;
}

interface LevelConfig {
  cols: number;
  points: number;
  animals: Animal[];
}

const ANIMAL_SETS: Record<Nivel, LevelConfig> = {
  Básico: {
    cols: 3,
    points: 30,
    animals: [
      { id: "cat", word: "Cat", emoji: "🐱" },
      { id: "dog", word: "Dog", emoji: "🐶" },
      { id: "cow", word: "Cow", emoji: "🐄" },
      { id: "duck", word: "Duck", emoji: "🦆" },
      { id: "lion", word: "Lion", emoji: "🦁" },
      { id: "fox", word: "Fox", emoji: "🦊" },
    ],
  },
  Intermediário: {
    cols: 4,
    points: 40,
    animals: [
      { id: "elephant", word: "Elephant", emoji: "🐘" },
      { id: "giraffe", word: "Giraffe", emoji: "🦒" },
      { id: "zebra", word: "Zebra", emoji: "🦓" },
      { id: "monkey", word: "Monkey", emoji: "🐒" },
      { id: "panda", word: "Panda", emoji: "🐼" },
      { id: "kangaroo", word: "Kangaroo", emoji: "🦘" },
      { id: "dolphin", word: "Dolphin", emoji: "🐬" },
      { id: "penguin", word: "Penguin", emoji: "🐧" },
    ],
  },
  Avançado: {
    cols: 4,
    points: 55,
    animals: [
      { id: "rhinoceros", word: "Rhinoceros", emoji: "🦏" },
      { id: "chimpanzee", word: "Chimpanzee", emoji: "🐵" },
      { id: "octopus", word: "Octopus", emoji: "🐙" },
      { id: "crocodile", word: "Crocodile", emoji: "🐊" },
      { id: "peacock", word: "Peacock", emoji: "🦚" },
      { id: "hedgehog", word: "Hedgehog", emoji: "🦔" },
      { id: "flamingo", word: "Flamingo", emoji: "🦩" },
      { id: "chameleon", word: "Chameleon", emoji: "🦎" },
      { id: "scorpion", word: "Scorpion", emoji: "🦂" },
      { id: "jellyfish", word: "Jellyfish", emoji: "🪼" },
    ],
  },
};

interface Card {
  key: string;
  pairId: string;
  type: "word" | "emoji";
  content: string;
}

// Monta o baralho: cada animal vira 2 cartas (uma com a palavra, uma com o emoji).
function buildDeck(animals: Animal[]): Card[] {
  const cards: Card[] = [];
  animals.forEach((a) => {
    cards.push({ key: `${a.id}-word`, pairId: a.id, type: "word", content: a.word });
    cards.push({ key: `${a.id}-emoji`, pairId: a.id, type: "emoji", content: a.emoji });
  });
  return cards.sort(() => Math.random() - 0.5);
}

export default function MemoriaAnimaisGame() {
  const router = useRouter();
  const isGuest = !useProfileStore((state) => state.activeProfile);
  const [level, setLevel] = useState<Nivel>("Básico");
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(ANIMAL_SETS.Básico.animals));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const config = ANIMAL_SETS[level];

  useEffect(() => {
    setHighScore(getHighScore(GAME_ID));
  }, []);

  const isWon = matched.length === config.animals.length;

  const changeLevel = (newLevel: Nivel) => {
    setLevel(newLevel);
    setDeck(buildDeck(ANIMAL_SETS[newLevel].animals));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setScore(0);
    setLocked(false);
  };

  const handleFlip = (index: number) => {
    if (locked) return;
    if (flipped.includes(index)) return;
    if (matched.includes(deck[index].pairId)) return;
    if (flipped.length === 2) return;

    const next = [...flipped, index];
    setFlipped(next);

    if (next.length === 2) {
      setLocked(true);
      setMoves((m) => m + 1);
      const [a, b] = next;
      const isMatch = deck[a].pairId === deck[b].pairId && deck[a].type !== deck[b].type;

      setTimeout(() => {
        if (isMatch) {
          setMatched((prev) => [...prev, deck[a].pairId]);
          setScore((s) => s + config.points);
        }
        setFlipped([]);
        setLocked(false);
      }, isMatch ? 500 : 900);
    }
  };

  // Salva o recorde num efeito (não dentro do updater de setMatched/setScore)
  // pra não repetir o bug de updater impuro duplicando a pontuação em Strict
  // Mode — dispara só quando o jogo vira "vencido".
  useEffect(() => {
    if (isWon) setHighScore(saveHighScoreIfBetter(GAME_ID, score));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWon]);

  const resetGame = () => changeLevel(level);

  return (
    <div className="relative min-h-[calc(100vh-96px)] w-full overflow-hidden">
      <BrandGlow />

      <div className="relative z-10 flex items-center justify-between border-b border-cinema-border px-5 pb-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-cinema-border bg-cinema-surface"
        >
          <ArrowLeft className="h-4 w-4 text-cinema-muted" />
        </button>
        <ProfileHeaderBadge />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-12 sm:max-w-2xl md:max-w-4xl lg:max-w-5xl">
        <div className="pt-5">
          <div className="mb-1 flex items-center gap-2">
            <Brain className="h-5 w-5" style={{ color: "#2D65AE" }} />
            <h1 className="font-display text-2xl font-bold text-cinema-text">Memória dos Animais</h1>
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="font-body text-sm text-cinema-muted">Combine a palavra com o bichinho certo</p>
            <span
              className="mt-1 flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-wider"
              style={{ border: "1px solid rgba(251,198,7,0.35)", backgroundColor: "rgba(251,198,7,0.12)", color: "#B8860B" }}
            >
              <Trophy className="h-2.5 w-2.5" />
              {score} pts
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            {highScore > 0 ? (
              <p className="font-body text-[11px] font-bold text-cinema-muted">Recorde: {highScore} pts</p>
            ) : (
              <span />
            )}
            <span className="font-body text-[11px] font-bold text-cinema-muted">{moves} jogadas</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {LEVEL_ORDER.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => changeLevel(l)}
              className="flex-1 rounded-full border px-3 py-2 font-body text-xs font-bold transition-all"
              style={
                level === l
                  ? { background: LEVEL_STYLES[l].chipBg, color: "#fff", borderColor: "transparent" }
                  : { backgroundColor: "rgb(var(--cinema-surface))", borderColor: "rgb(var(--cinema-border))", color: undefined }
              }
            >
              {l}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3" style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)` }}>
          {deck.map((card, i) => {
            const isFlipped = flipped.includes(i) || matched.includes(card.pairId);
            const isMatched = matched.includes(card.pairId);
            return (
              <div
                key={card.key}
                className={`aspect-square ${isMatched ? "animate-match-pulse" : ""}`}
                style={{ perspective: "800px" }}
              >
                <button
                  type="button"
                  onClick={() => handleFlip(i)}
                  className="relative h-full w-full transition-transform duration-300"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-cinema-sm bg-cinema-primary"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <span className="text-xl text-white">?</span>
                  </div>
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-cinema-sm border"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      backgroundColor: isMatched ? "rgba(34,197,94,0.12)" : "rgb(var(--cinema-surface))",
                      borderColor: isMatched ? "rgba(34,197,94,0.35)" : "rgb(var(--cinema-border))",
                    }}
                  >
                    {card.type === "emoji" ? (
                      <span className="text-2xl">{card.content}</span>
                    ) : (
                      <span className="px-1 text-center font-display text-xs font-bold text-cinema-text">
                        {card.content}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {isWon && (
          <div
            className="mt-6 animate-pop-in rounded-2xl p-5 text-center"
            style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}
          >
            <div className="mb-2 text-3xl">🎉</div>
            <h3 className="mb-1 font-display text-lg font-bold" style={{ color: "#16a34a" }}>
              Muito bem!
            </h3>
            <p className="mb-4 font-body text-sm text-cinema-muted">
              {score} pontos em {moves} jogadas
            </p>
            <button
              type="button"
              onClick={resetGame}
              className="mx-auto flex items-center gap-2 rounded-full bg-cinema-primary px-5 py-2.5 font-display text-sm font-bold text-white"
            >
              <RotateCcw className="h-4 w-4" />
              Jogar de novo
            </button>
            {isGuest && <GuestSignupPrompt />}
          </div>
        )}
      </div>
    </div>
  );
}
