/**
 * Controle de acesso a catálogos com nível (Series, Video/Listening): trial
 * de 7 dias, item grátis-permanente (freeAfterTrial), grandfathering
 * (progresso já iniciado) e trava de nível (Básico → Intermediário →
 * Avançado / Iniciante → Intermediário → Avançado).
 *
 * Prioridade das regras (nunca mudar a ordem):
 *   1. bypass (admin, calculado no server a partir da role da sessão)
 *   2. trial ativo → libera tudo
 *   3. freeAfterTrial → sempre liberado
 *   4. hasStartedProgress → liberado (grandfathering)
 *   5. nível anterior não completo → 'locked-progress'
 *   6. nada acima se aplica → 'locked-premium'
 *
 * Centralizada aqui (não duplicada entre apps/web e apps/api, nem entre
 * catálogos diferentes) porque o mesmo cálculo precisa valer tanto pra UI
 * (dois cadeados) quanto pra API que serve o conteúdo de verdade
 * (vídeo/transcript) — ver SeriesService e VideosService.
 *
 * O motor (computeUnlockedLevels/computeAccessStatus) é genérico sobre o
 * enum de nível — Series e Video usam enums diferentes (SeriesLevel:
 * BASICO/INTERMEDIARIO/AVANCADO vs VideoLevel: INICIANTE/INTERMEDIARIO/
 * AVANCADO) que só coincidem em ter 3 degraus. As funções *Series* abaixo
 * são wrappers finos do motor genérico — mantidas por compatibilidade com
 * quem já importa computeSeriesAccessStatus/computeUnlockedSeriesLevels.
 */
import type { SeriesLevel } from "../schemas/series.schema";
import type { VideoLevel } from "../schemas/videos.schema";

export const TRIAL_DAYS = 7;

export function isTrialActive(trialStartedAt: Date | string | null | undefined): boolean {
  if (!trialStartedAt) return false;
  const trialEnd = new Date(trialStartedAt).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() < trialEnd;
}

export function trialDaysRemaining(trialStartedAt: Date | string | null | undefined): number {
  if (!trialStartedAt) return 0;
  const trialEnd = new Date(trialStartedAt).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const msLeft = trialEnd - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}

export interface LevelProgressionItem<L extends string = string> {
  level: L;
  hasContent: boolean;
  completed: boolean;
}

// bypass: true = ignora a trava de progresso (uso do admin) — quem chama
// precisa ter calculado isso a partir de uma role autenticada, nunca de
// input do client.
//
// levelOrder define a cascata (índice 0 sempre destravado; índice i destrava
// quando o índice i-1 está destravado E tem conteúdo E está 100% completo).
export function computeUnlockedLevels<L extends string>(
  items: LevelProgressionItem<L>[],
  levelOrder: readonly L[],
  bypass = false,
): Record<L, boolean> {
  const unlocked = Object.fromEntries(levelOrder.map((level, i) => [level, i === 0])) as Record<L, boolean>;

  if (bypass) {
    for (const level of levelOrder) unlocked[level] = true;
    return unlocked;
  }

  for (let i = 1; i < levelOrder.length; i += 1) {
    const previousLevel = levelOrder[i - 1];
    if (!unlocked[previousLevel]) continue; // cascata já quebrou antes

    const previousWithContent = items.filter((item) => item.level === previousLevel && item.hasContent);
    unlocked[levelOrder[i]] = previousWithContent.length > 0 && previousWithContent.every((item) => item.completed);
  }

  return unlocked;
}

export type AccessStatus = "unlocked" | "locked-progress" | "locked-premium";

export interface AccessControlItem<L extends string = string> extends LevelProgressionItem<L> {
  id: string;
  freeAfterTrial: boolean;
  hasStartedProgress: boolean;
}

export interface AccessControlProfile {
  trialStartedAt: Date | string | null | undefined;
}

export interface AccessControlResult<L extends string = string> {
  statusById: Record<string, AccessStatus>;
  trialActive: boolean;
  unlockedLevels: Record<L, boolean>;
  bypass: boolean;
}

export function computeAccessStatus<L extends string>(
  items: AccessControlItem<L>[],
  profile: AccessControlProfile,
  levelOrder: readonly L[],
  bypass = false,
): AccessControlResult<L> {
  const trialActive = isTrialActive(profile?.trialStartedAt);
  const unlockedLevels = computeUnlockedLevels(items, levelOrder, bypass);

  const statusById: Record<string, AccessStatus> = {};
  for (const item of items) {
    if (bypass) {
      statusById[item.id] = "unlocked";
      continue;
    }
    if (trialActive) {
      statusById[item.id] = "unlocked";
      continue;
    }
    if (item.freeAfterTrial) {
      statusById[item.id] = "unlocked";
      continue;
    }
    if (item.hasStartedProgress) {
      statusById[item.id] = "unlocked"; // grandfathering
      continue;
    }
    if (!unlockedLevels[item.level]) {
      statusById[item.id] = "locked-progress";
      continue;
    }
    statusById[item.id] = "locked-premium";
  }

  return { statusById, trialActive, unlockedLevels, bypass };
}

// --- Wrappers específicos de Series (compatibilidade — ver motor genérico acima) ---

export const SERIES_LEVEL_ORDER: SeriesLevel[] = ["BASICO", "INTERMEDIARIO", "AVANCADO"];

export function computeUnlockedSeriesLevels(
  items: LevelProgressionItem<SeriesLevel>[],
  bypass = false,
): Record<SeriesLevel, boolean> {
  return computeUnlockedLevels(items, SERIES_LEVEL_ORDER, bypass);
}

export function computeSeriesAccessStatus(
  items: AccessControlItem<SeriesLevel>[],
  profile: AccessControlProfile,
  bypass = false,
): AccessControlResult<SeriesLevel> {
  return computeAccessStatus(items, profile, SERIES_LEVEL_ORDER, bypass);
}

// --- Wrappers específicos de Listening/Video (mesmo motor genérico) ---

export const VIDEO_LEVEL_ORDER: VideoLevel[] = ["INICIANTE", "INTERMEDIARIO", "AVANCADO"];

export function computeUnlockedVideoLevels(
  items: LevelProgressionItem<VideoLevel>[],
  bypass = false,
): Record<VideoLevel, boolean> {
  return computeUnlockedLevels(items, VIDEO_LEVEL_ORDER, bypass);
}

export function computeVideoAccessStatus(
  items: AccessControlItem<VideoLevel>[],
  profile: AccessControlProfile,
  bypass = false,
): AccessControlResult<VideoLevel> {
  return computeAccessStatus(items, profile, VIDEO_LEVEL_ORDER, bypass);
}

// Não existe (ainda) tabela/campo de assinatura Premium no schema — este
// stub é o único ponto a trocar quando o plano pago existir de verdade.
// Enquanto isso, ninguém é Premium: fora do trial, todo mundo cai no plano
// gratuito (freeAfterTrial/grandfathering/limite de mensagens de IA).
export function isPremiumProfile(_profile: unknown): boolean {
  return false;
}
