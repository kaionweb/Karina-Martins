import { Injectable } from "@nestjs/common";
import { prisma } from "@ipp/database";

function utcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const STREAK_BADGE_THRESHOLD = 3;

interface BadgeDefinition {
  code: string;
  title: string;
  description: string;
  iconKey: string;
}

const BADGE_DEFINITIONS = {
  FIRST_LESSON: {
    code: "FIRST_LESSON",
    title: "Primeira Lição",
    description: "Concluiu a primeira lição na plataforma.",
    iconKey: "badges/first-lesson",
  },
  STREAK_3: {
    code: "STREAK_3",
    title: "Sequência de 3 dias",
    description: "Usou a plataforma por 3 dias seguidos.",
    iconKey: "badges/streak-3",
  },
} satisfies Record<string, BadgeDefinition>;

type BadgeCode = keyof typeof BADGE_DEFINITIONS;

@Injectable()
export class GamificationService {
  async getXpTotal(profileId: string) {
    const result = await prisma.xpEvent.aggregate({ _sum: { amount: true }, where: { profileId } });
    return { total: result._sum.amount ?? 0 };
  }

  async getRanking(profileId: string): Promise<{ position: number | null; totalParticipants: number }> {
    // Perfil ativo — garante que existe (mesmo padrão de updateStreaks).
    const activeProfile = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });

    // Todos os perfis CHILD, ordenados por createdAt asc: essa ordem inicial é o
    // critério de desempate determinístico (perfil mais antigo fica melhor entre XPs iguais).
    const childProfiles = await prisma.profile.findMany({
      where: { type: "CHILD" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    const totalParticipants = childProfiles.length;

    // Ranking não se aplica a perfis ADULT: não é erro, é "não aplicável".
    if (activeProfile.type !== "CHILD") {
      return { position: null, totalParticipants };
    }

    // Soma de XP por perfil (apenas os CHILD). Quem não tem XpEvent não aparece
    // no groupBy → default 0 no mapa abaixo.
    const childIds = childProfiles.map((profile) => profile.id);
    const sums = await prisma.xpEvent.groupBy({
      by: ["profileId"],
      where: { profileId: { in: childIds } },
      _sum: { amount: true },
    });
    const totalByProfile = new Map<string, number>(childIds.map((id) => [id, 0]));
    for (const row of sums) {
      totalByProfile.set(row.profileId, row._sum.amount ?? 0);
    }

    // Ordena por XP desc. Array.prototype.sort é estável no V8 moderno: entre XPs
    // iguais a ordem original (createdAt asc) é preservada → desempate determinístico.
    const ranked = [...childIds].sort((a, b) => (totalByProfile.get(b) ?? 0) - (totalByProfile.get(a) ?? 0));

    const position = ranked.indexOf(profileId) + 1; // 1-indexed; indexOf sempre encontra (perfil é CHILD)
    return { position, totalParticipants };
  }

  async updateStreaks() {
    const today = utcMidnight(new Date());
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const activeToday = await prisma.xpEvent.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
      select: { profileId: true },
      distinct: ["profileId"],
    });

    let profilesUpdated = 0;

    for (const { profileId } of activeToday) {
      const profile = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });

      const alreadyProcessedToday = profile.lastActiveDate?.getTime() === today.getTime();
      if (alreadyProcessedToday) {
        continue;
      }

      const wasActiveYesterday = profile.lastActiveDate?.getTime() === yesterday.getTime();
      const currentStreak = wasActiveYesterday ? profile.currentStreak + 1 : 1;
      const longestStreak = Math.max(profile.longestStreak, currentStreak);

      await prisma.profile.update({
        where: { id: profileId },
        data: { currentStreak, longestStreak, lastActiveDate: today },
      });

      if (currentStreak >= STREAK_BADGE_THRESHOLD) {
        await this.awardBadgeIfEligible(profileId, "STREAK_3");
      }

      profilesUpdated++;
    }

    return { profilesUpdated };
  }

  async awardBadgeIfEligible(profileId: string, code: BadgeCode) {
    const definition = BADGE_DEFINITIONS[code];
    const badge = await prisma.badge.upsert({
      where: { code: definition.code },
      create: definition,
      update: {},
    });

    const alreadyAwarded = await prisma.profileBadge.findFirst({ where: { profileId, badgeId: badge.id } });
    if (alreadyAwarded) {
      return;
    }

    await prisma.profileBadge.create({ data: { profileId, badgeId: badge.id } });
  }

  async getBadges(profileId: string) {
    const profileBadges = await prisma.profileBadge.findMany({
      where: { profileId },
      include: { badge: true },
      orderBy: { awardedAt: "asc" },
    });

    return profileBadges.map((profileBadge) => ({
      id: profileBadge.badge.id,
      code: profileBadge.badge.code,
      title: profileBadge.badge.title,
      description: profileBadge.badge.description,
      iconKey: profileBadge.badge.iconKey,
      awardedAt: profileBadge.awardedAt,
    }));
  }
}
