import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ipp/database";
import type { CreateChildProfileInput } from "@ipp/shared";
import { apiErrorBody } from "../../common/errors/api-error";
import { signAccessToken, signRefreshToken, type AccessTokenPayload } from "../../common/auth/jwt.util";
import { REFRESH_TOKEN_EXPIRES_IN } from "../../common/auth/refresh-cookie";

const ACCESS_TOKEN_EXPIRES_IN = "15m";

@Injectable()
export class ProfilesService {
  async isChildProfile(profileId: string): Promise<boolean> {
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    return profile?.type === "CHILD";
  }

  async listForUser(activeUser: AccessTokenPayload) {
    if (activeUser.profileId) {
      const activeProfile = await prisma.profile.findUnique({ where: { id: activeUser.profileId } });
      if (activeProfile?.type === "CHILD") {
        throw new ForbiddenException(
          apiErrorBody("FORBIDDEN", "Perfis infantis não podem listar outros perfis da conta"),
        );
      }
    }

    return prisma.profile.findMany({ where: { userId: activeUser.sub } });
  }

  async createChildProfile(activeUser: AccessTokenPayload, input: CreateChildProfileInput) {
    if (activeUser.profileId && (await this.isChildProfile(activeUser.profileId))) {
      throw new ForbiddenException(
        apiErrorBody("FORBIDDEN", "Perfis infantis não podem criar novos perfis"),
      );
    }

    return prisma.profile.create({
      data: {
        userId: activeUser.sub,
        type: "CHILD",
        nickname: input.nickname,
        ageRange: input.ageRange ?? null,
      },
    });
  }

  async updateAvatar(activeUser: AccessTokenPayload, targetProfileId: string, avatarUrl: string | null) {
    // Só o próprio perfil ativo pode editar sua foto — não dá pra um perfil
    // mexer no avatar de outro perfil da mesma conta (nem o ADULT no CHILD,
    // nem entre dois ADULT). Mesmo padrão de "self-only" das outras rotas.
    if (!activeUser.profileId || activeUser.profileId !== targetProfileId) {
      throw new ForbiddenException(
        apiErrorBody("FORBIDDEN", "Só é possível editar a foto do próprio perfil ativo"),
      );
    }

    const targetProfile = await prisma.profile.findUnique({ where: { id: targetProfileId } });
    if (!targetProfile || targetProfile.userId !== activeUser.sub) {
      throw new NotFoundException(apiErrorBody("PROFILE_NOT_FOUND", "Perfil não encontrado"));
    }

    // CLAUDE.md — REGRAS DE DOMÍNIO: perfis CHILD coletam só apelido + faixa
    // etária, sem foto. Bloqueado aqui mesmo que a UI já esconda o botão.
    if (targetProfile.type !== "ADULT") {
      throw new ForbiddenException(apiErrorBody("FORBIDDEN", "Perfis infantis não podem ter foto de perfil"));
    }

    return prisma.profile.update({ where: { id: targetProfileId }, data: { avatarUrl } });
  }

  async selectProfile(activeUser: AccessTokenPayload, targetProfileId: string) {
    const targetProfile = await prisma.profile.findUnique({ where: { id: targetProfileId } });

    // Não diferenciar "não existe" de "existe mas não é seu" — evita confirmar
    // a validade de IDs de perfil de outras contas para quem não tem acesso.
    if (!targetProfile || targetProfile.userId !== activeUser.sub) {
      throw new NotFoundException(apiErrorBody("PROFILE_NOT_FOUND", "Perfil não encontrado"));
    }

    // SEC-002 (QA Gate FAIL, Story 1.4): um perfil CHILD ativo não pode trocar
    // para NENHUM outro perfil da conta (nem ADULT, nem outro CHILD) — sem essa
    // checagem, um token CHILD conseguia se autopromover a ADULT.
    if (activeUser.profileId && activeUser.profileId !== targetProfileId) {
      const activeProfile = await prisma.profile.findUnique({ where: { id: activeUser.profileId } });
      if (activeProfile?.type === "CHILD") {
        throw new ForbiddenException(
          apiErrorBody("FORBIDDEN", "Perfis infantis não podem trocar para outro perfil"),
        );
      }
    }

    return {
      accessToken: signAccessToken({ sub: activeUser.sub, profileId: targetProfileId }, ACCESS_TOKEN_EXPIRES_IN),
      refreshToken: signRefreshToken({ sub: activeUser.sub, profileId: targetProfileId }, REFRESH_TOKEN_EXPIRES_IN),
    };
  }
}
