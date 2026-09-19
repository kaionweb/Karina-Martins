import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { prisma } from "@ipp/database";
import type { LoginInput, RegisterInput } from "@ipp/shared";
import { apiErrorBody } from "../../common/errors/api-error";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../common/auth/jwt.util";
import { REFRESH_TOKEN_EXPIRES_IN } from "../../common/auth/refresh-cookie";
import type { GoogleUserPayload } from "./google.strategy";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const PASSWORD_HASH_ROUNDS = 10;

@Injectable()
export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException(apiErrorBody("EMAIL_ALREADY_EXISTS", "Este email já está cadastrado"));
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        profiles: {
          create: { nickname: input.name?.trim() || input.email.split("@")[0], type: "ADULT" },
        },
      },
    });

    return { id: user.id, email: user.email };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException(apiErrorBody("INVALID_CREDENTIALS", "Email ou senha inválidos"));
    }

    return this.issueTokens(user.id);
  }

  async loginWithGoogle(googleUser: GoogleUserPayload) {
    const existingByGoogleId = await prisma.user.findUnique({ where: { googleId: googleUser.googleId } });
    if (existingByGoogleId) {
      return this.issueTokens(existingByGoogleId.id);
    }

    // Só confia no email do perfil Google para vincular/criar conta se ele já foi verificado
    // pelo próprio Google — evita que alguém tome uma conta existente com um email não confirmado.
    if (!googleUser.emailVerified) {
      throw new UnauthorizedException(
        apiErrorBody("GOOGLE_EMAIL_NOT_VERIFIED", "Não foi possível confirmar seu email do Google"),
      );
    }

    const existingByEmail = await prisma.user.findUnique({ where: { email: googleUser.email } });
    if (existingByEmail) {
      const linked = existingByEmail.googleId
        ? existingByEmail
        : await prisma.user.update({
            where: { id: existingByEmail.id },
            data: { googleId: googleUser.googleId },
          });
      return this.issueTokens(linked.id);
    }

    const user = await prisma.user.create({
      data: {
        email: googleUser.email,
        googleId: googleUser.googleId,
        profiles: {
          create: { nickname: googleUser.email.split("@")[0], type: "ADULT" },
        },
      },
    });

    return this.issueTokens(user.id);
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException(apiErrorBody("MISSING_REFRESH_TOKEN", "Refresh token ausente"));
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException(apiErrorBody("INVALID_REFRESH_TOKEN", "Refresh token inválido ou expirado"));
    }

    // Devolve o resumo do PRÓPRIO perfil ativo (não a lista da conta) para que o
    // front repopule a sessão após um reload sem chamar GET /profiles — rota que
    // um token CHILD não pode usar (SEC-002, Story 1.4). O findFirst com userId
    // reforça que o perfil pertence ao dono do refresh token (defesa em
    // profundidade, mesmo padrão de ProfilesService.selectProfile).
    const profile = payload.profileId
      ? await prisma.profile.findFirst({ where: { id: payload.profileId, userId: payload.sub } })
      : null;

    return {
      accessToken: signAccessToken({ sub: payload.sub, profileId: payload.profileId }, ACCESS_TOKEN_EXPIRES_IN),
      profile,
    };
  }

  private issueTokens(userId: string) {
    return {
      accessToken: signAccessToken({ sub: userId }, ACCESS_TOKEN_EXPIRES_IN),
      refreshToken: signRefreshToken({ sub: userId }, REFRESH_TOKEN_EXPIRES_IN),
    };
  }
}
