import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ipp/database";
import type { AdminProfileOption } from "@ipp/shared";
import { apiErrorBody } from "../../common/errors/api-error";

@Injectable()
export class AdminService {
  // Perfis reais de toda a plataforma pro dropdown do modo comparação
  // (/admin/access-preview) — substitui o profile de teste fixo do protótipo
  // original por um seletor de perfil de aluno de verdade.
  async listProfilesForPreview(): Promise<AdminProfileOption[]> {
    const profiles = await prisma.profile.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "asc" },
    });

    return profiles.map((profile) => ({
      id: profile.id,
      nickname: profile.nickname,
      type: profile.type,
      familyEmail: profile.user.email,
    }));
  }

  async requireProfile(profileId: string): Promise<void> {
    const profile = await prisma.profile.findUnique({ where: { id: profileId }, select: { id: true } });
    if (!profile) {
      throw new NotFoundException(apiErrorBody("PROFILE_NOT_FOUND", "Perfil não encontrado"));
    }
  }
}
