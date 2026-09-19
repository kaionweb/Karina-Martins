import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { prisma } from "@ipp/database";
import { apiErrorBody } from "../errors/api-error";
import type { AuthenticatedRequest } from "./jwt-auth.guard";

/**
 * Único ponto que decide "este userId é o administrador da plataforma?" —
 * usado tanto pelo AdminGuard (bloqueia rotas /admin/*) quanto por serviços
 * de conteúdo (ex.: SeriesService) que precisam calcular o `bypass` do
 * controle de acesso a partir da sessão autenticada, nunca de um valor vindo
 * do client (query param, prop solta).
 *
 * Fail-closed (mesmo espírito do fail-fast de buildCorsOptions, Story 1.5): se
 * ADMIN_EMAIL estiver vazio/undefined, NINGUÉM é considerado admin.
 */
export async function isAdminUser(userId: string | undefined): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !userId) {
    return false;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.email === adminEmail;
}

/**
 * Bypass do controle de acesso a CONTEÚDO (Series/Videos/VideoWatch) — usado
 * pelos controllers desses módulos, nunca pelo AdminGuard (que continua
 * email-only, ver isAdminUser acima). Diferente de "é admin da plataforma":
 * o bypass de conteúdo só vale quando o perfil ATIVO é ADULT (ou nenhum
 * perfil foi selecionado ainda). Sem essa distinção, um perfil CHILD da
 * própria conta admin (ex.: a família de demonstração) também herdaria
 * bypass e nunca veria a trava de trial/premium/progresso de verdade — foi
 * exatamente esse sintoma que motivou esta função.
 */
export async function isAdminBypass(userId: string | undefined, profileId: string | undefined): Promise<boolean> {
  if (!(await isAdminUser(userId))) return false;
  if (!profileId) return true;

  const profile = await prisma.profile.findUnique({ where: { id: profileId }, select: { type: true } });
  return profile?.type === "ADULT";
}

/**
 * Autoriza apenas o administrador da plataforma (ver isAdminUser acima).
 *
 * DEVE rodar DEPOIS de JwtAuthGuard na cadeia de guards
 * (`@UseGuards(JwtAuthGuard, AdminGuard)`): assume que request.user.sub já foi
 * populado.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!(await isAdminUser(request.user?.sub))) {
      throw new ForbiddenException(apiErrorBody("ADMIN_ONLY", "Acesso restrito ao administrador"));
    }

    return true;
  }
}
