import { Film, Headphones, MessageCircle, Mic, Sparkles, Tv, Crown, type LucideIcon } from "lucide-react";

/**
 * Dados de demonstração desta fase (Design System / telas base).
 * Conteúdo 100% original — sem imagens/nomes de obras de terceiros
 * (CLAUDE.md: catálogo restrito a metadados factuais + conteúdo original).
 * Os "pôsteres" são artes tipográficas (gradientes + título), como no
 * protótipo em docs/prototipo/layout-app-ingles.jsx.
 */

export interface MockTrilha {
  titulo: string;
  genero: string;
  nivel: string;
  licoes: number;
  background: string;
}

export const trilhas: MockTrilha[] = [
  {
    titulo: "Risadas em Inglês",
    genero: "Comédia",
    nivel: "Intermediário",
    licoes: 18,
    background: "linear-gradient(160deg,#FF8A3C 0%,#E8332A 55%,#8E1B4B 100%)",
  },
  {
    titulo: "Mistérios da Cidade",
    genero: "Suspense",
    nivel: "Avançado",
    licoes: 24,
    background: "linear-gradient(160deg,#1B2A5B 0%,#123B5C 60%,#0A1A2E 100%)",
  },
  {
    titulo: "Mundo Animal",
    genero: "Infantil",
    nivel: "Básico",
    licoes: 12,
    background: "linear-gradient(160deg,#3ECF8E 0%,#1E9E6A 55%,#0C4F38 100%)",
  },
];

export interface MockCatalogoItem {
  titulo: string;
  nivel: string;
  background: string;
}

export const catalogo: MockCatalogoItem[] = [
  { titulo: "Pequenos Heróis", nivel: "Básico", background: "linear-gradient(160deg,#4C8DFF,#2A3FB8)" },
  { titulo: "Fundo do Mar", nivel: "Básico", background: "linear-gradient(160deg,#22B8CF,#14508A)" },
  { titulo: "Grandes Emoções", nivel: "Intermediário", background: "linear-gradient(160deg,#FFB23E,#E8332A)" },
  { titulo: "Viagem no Tempo", nivel: "Avançado", background: "linear-gradient(160deg,#6A5AE0,#22254A)" },
];

export interface MockCategoria {
  nome: string;
  icon: LucideIcon;
  cor: string;
}

export const categorias: MockCategoria[] = [
  { nome: "Séries", icon: Tv, cor: "#4C8DFF" },
  { nome: "Filmes", icon: Film, cor: "#E8332A" },
  { nome: "Conversação", icon: MessageCircle, cor: "#3ECF8E" },
  { nome: "Pronúncia", icon: Mic, cor: "#FFB23E" },
  { nome: "Listening", icon: Headphones, cor: "#B06AF0" },
  { nome: "IA", icon: Sparkles, cor: "#FF4D6D" },
  { nome: "Premium", icon: Crown, cor: "#FFD166" },
];

export const filtrosExplorar = {
  nivel: ["Básico", "Intermediário", "Avançado"],
  genero: ["Comédia", "Romance", "Suspense", "Infantil"],
  habilidade: ["Listening", "Vocabulary", "Speaking"],
};

export const jornadaMock = {
  xpTotal: 2450,
  medalhas: 14,
  ranking: "3º",
  progressoXp: 68,
};

export const continueAprendendo = {
  titulo: "Aventura na Floresta",
  descricao: "Trilha 1 · Lição 9 de 12",
  progresso: 75,
  background: trilhas[2].background,
};

// Filmes saiu daqui — agora vem de dados reais (Filme no Prisma, ver
// apps/web/src/lib/api/filmes.ts). Séries também (Series/SeriesEpisode, ver
// apps/web/src/lib/api/series.ts).

// Tela de drill-down /conversacao (Home → categoria) — cenários de prática
// 100% mock. O chat real (/ai/chat/en) só aceita lessonId; não existe conceito
// de "cenário" no backend, então os cards aqui ainda não abrem chat nenhum.
export interface MockCenario {
  id: string;
  titulo: string;
  emoji: string;
  nivel: string;
  faixaEtaria: string;
  frases: number;
}

export const conversacaoMock: MockCenario[] = [
  { id: "c1", titulo: "No Supermercado", emoji: "🛒", nivel: "Básico", faixaEtaria: "3+", frases: 12 },
  { id: "c2", titulo: "Fazendo Amigos", emoji: "🤝", nivel: "Básico", faixaEtaria: "3+", frases: 10 },
  { id: "c3", titulo: "Na Escola", emoji: "🎒", nivel: "Básico", faixaEtaria: "3+", frases: 15 },
  { id: "c4", titulo: "Pedindo Comida", emoji: "🍕", nivel: "Intermediário", faixaEtaria: "5+", frases: 14 },
  { id: "c5", titulo: "No Parque", emoji: "🌳", nivel: "Básico", faixaEtaria: "3+", frases: 11 },
  { id: "c6", titulo: "Contando uma História", emoji: "📖", nivel: "Avançado", faixaEtaria: "8+", frases: 20 },
];

// Tela /games (Home → categoria) — grade de mini-games 100% mock/prévia
// visual (catálogo fixo, sem backend). bloqueado/high score são ilustrativos
// (bloqueado = jogo sem tela própria ainda — g7/g8 hoje). `premium` é o
// controle de acesso (trial/premium) — cosmético só, sem tabela no banco: não
// há dado sensível por trás de um mini-game pra proteger no servidor (ver
// gate da sessão "aplicar cadeado em Conversação/Pronúncia/Games").
export interface MockGame {
  id: string;
  titulo: string;
  emoji: string;
  desc: string;
  gradiente: string;
  bloqueado: boolean;
  highScore: number;
  premium: boolean;
}

export const gamesMock: MockGame[] = [
  { id: "g1", titulo: "Caça-Palavras", emoji: "🔤", desc: "Encontre as palavras em inglês escondidas", gradiente: "from-cyan-400 to-blue-600", bloqueado: false, highScore: 240, premium: false },
  { id: "g2", titulo: "Memória dos Animais", emoji: "🃏", desc: "Combine os pares de animais em inglês", gradiente: "from-emerald-400 to-green-600", bloqueado: false, highScore: 180, premium: false },
  { id: "g3", titulo: "Corrida das Letras", emoji: "🏃", desc: "Monte palavras antes do tempo acabar", gradiente: "from-amber-400 to-orange-600", bloqueado: false, highScore: 0, premium: false },
  { id: "g4", titulo: "Quiz Relâmpago", emoji: "⚡", desc: "Responda rápido antes que o tempo acabe", gradiente: "from-fuchsia-400 to-purple-600", bloqueado: false, highScore: 0, premium: false },
  { id: "g5", titulo: "Pintando em Inglês", emoji: "🎨", desc: "Pinte e aprenda o nome das cores", gradiente: "from-pink-400 to-rose-600", bloqueado: false, highScore: 0, premium: true },
  { id: "g6", titulo: "Labirinto do Alfabeto", emoji: "🧩", desc: "Guie o personagem até a letra certa", gradiente: "from-indigo-400 to-blue-700", bloqueado: false, highScore: 0, premium: true },
  { id: "g7", titulo: "Bingo dos Sons", emoji: "🎧", desc: "Ouça a palavra e marque na cartela", gradiente: "from-sky-400 to-cyan-600", bloqueado: true, highScore: 0, premium: true },
  { id: "g8", titulo: "Sequência Musical", emoji: "🎹", desc: "Repita a sequência de cores em inglês", gradiente: "from-violet-400 to-purple-700", bloqueado: true, highScore: 0, premium: true },
];

// Tela de drill-down /pronuncia (Home → categoria) — lista de palavras é mock,
// mas ouvir/gravar usam as Web Speech APIs nativas do navegador de verdade
// (SpeechSynthesis + SpeechRecognition, ver useSpeech em pronuncia/page.tsx).
// Estrelas atualizam em memória (estado local) e não persistem no backend.
export interface MockPalavra {
  id: string;
  word: string;
  traducao: string;
  emoji: string;
  nivel: string;
  estrelas: number;
}

export const pronunciaMock: MockPalavra[] = [
  // Básico
  { id: "p-b1", word: "Cat", traducao: "gato", emoji: "🐱", nivel: "Básico", estrelas: 3 },
  { id: "p-b2", word: "Dog", traducao: "cachorro", emoji: "🐶", nivel: "Básico", estrelas: 3 },
  { id: "p-b3", word: "Sun", traducao: "sol", emoji: "☀️", nivel: "Básico", estrelas: 2 },
  { id: "p-b4", word: "Cow", traducao: "vaca", emoji: "🐄", nivel: "Básico", estrelas: 0 },
  { id: "p-b5", word: "Bee", traducao: "abelha", emoji: "🐝", nivel: "Básico", estrelas: 0 },
  { id: "p-b6", word: "Hat", traducao: "chapéu", emoji: "🎩", nivel: "Básico", estrelas: 0 },
  { id: "p-b7", word: "Pen", traducao: "caneta", emoji: "🖊️", nivel: "Básico", estrelas: 0 },
  { id: "p-b8", word: "Cup", traducao: "xícara", emoji: "☕", nivel: "Básico", estrelas: 0 },
  { id: "p-b9", word: "Box", traducao: "caixa", emoji: "📦", nivel: "Básico", estrelas: 0 },
  { id: "p-b10", word: "Bus", traducao: "ônibus", emoji: "🚌", nivel: "Básico", estrelas: 0 },
  // Intermediário
  { id: "p-i1", word: "Elephant", traducao: "elefante", emoji: "🐘", nivel: "Intermediário", estrelas: 1 },
  { id: "p-i2", word: "Butterfly", traducao: "borboleta", emoji: "🦋", nivel: "Intermediário", estrelas: 0 },
  { id: "p-i3", word: "Rainbow", traducao: "arco-íris", emoji: "🌈", nivel: "Intermediário", estrelas: 0 },
  { id: "p-i4", word: "Giraffe", traducao: "girafa", emoji: "🦒", nivel: "Intermediário", estrelas: 0 },
  { id: "p-i5", word: "Monkey", traducao: "macaco", emoji: "🐒", nivel: "Intermediário", estrelas: 0 },
  { id: "p-i6", word: "Dolphin", traducao: "golfinho", emoji: "🐬", nivel: "Intermediário", estrelas: 0 },
  { id: "p-i7", word: "Penguin", traducao: "pinguim", emoji: "🐧", nivel: "Intermediário", estrelas: 0 },
  { id: "p-i8", word: "Balloon", traducao: "balão", emoji: "🎈", nivel: "Intermediário", estrelas: 0 },
  { id: "p-i9", word: "Bicycle", traducao: "bicicleta", emoji: "🚲", nivel: "Intermediário", estrelas: 0 },
  { id: "p-i10", word: "Umbrella", traducao: "guarda-chuva", emoji: "☂️", nivel: "Intermediário", estrelas: 0 },
  // Avançado
  { id: "p-a1", word: "Rhinoceros", traducao: "rinoceronte", emoji: "🦏", nivel: "Avançado", estrelas: 0 },
  { id: "p-a2", word: "Thunderstorm", traducao: "tempestade", emoji: "⛈️", nivel: "Avançado", estrelas: 0 },
  { id: "p-a3", word: "Refrigerator", traducao: "geladeira", emoji: "🧊", nivel: "Avançado", estrelas: 0 },
  { id: "p-a4", word: "Helicopter", traducao: "helicóptero", emoji: "🚁", nivel: "Avançado", estrelas: 0 },
  { id: "p-a5", word: "Kindergarten", traducao: "jardim de infância", emoji: "🏫", nivel: "Avançado", estrelas: 0 },
  { id: "p-a6", word: "Caterpillar", traducao: "lagarta", emoji: "🐛", nivel: "Avançado", estrelas: 0 },
  { id: "p-a7", word: "Watermelon", traducao: "melancia", emoji: "🍉", nivel: "Avançado", estrelas: 0 },
  { id: "p-a8", word: "Thermometer", traducao: "termômetro", emoji: "🌡️", nivel: "Avançado", estrelas: 0 },
  { id: "p-a9", word: "Strawberry", traducao: "morango", emoji: "🍓", nivel: "Avançado", estrelas: 0 },
  { id: "p-a10", word: "Extraordinary", traducao: "extraordinário", emoji: "✨", nivel: "Avançado", estrelas: 0 },
];

// Tela /premium (Home → categoria) — conteúdo estático da tela de upsell.
// Não existe checkout/assinatura real no projeto; "Assinar Premium" fica sem
// ação (nenhuma cobrança é processada por esta tela).
export interface MockBeneficio {
  titulo: string;
  desc: string;
}

export const premiumBeneficios: MockBeneficio[] = [
  { titulo: "Catálogo completo", desc: "Todas as séries e filmes, sem espera" },
  { titulo: "IA sem limites", desc: "Conversas ilimitadas com a tutora" },
  { titulo: "Pronúncia avançada", desc: "Feedback detalhado a cada tentativa" },
  { titulo: "Todos os games", desc: "Inclui os jogos exclusivos premium" },
];

export interface MockPlano {
  id: string;
  label: string;
  preco: string;
  periodo: string;
  badge: string | null;
}

export const premiumPlanos: MockPlano[] = [
  { id: "monthly", label: "Mensal", preco: "R$ 29,90", periodo: "/mês", badge: null },
  { id: "yearly", label: "Anual", preco: "R$ 19,90", periodo: "/mês", badge: "Economize 33%" },
];
