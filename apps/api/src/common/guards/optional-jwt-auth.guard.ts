import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { verifyAccessToken, type AccessTokenPayload } from "../auth/jwt.util";

export interface OptionallyAuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

// Mesma checagem do JwtAuthGuard, mas nunca bloqueia a requisição — usado em
// rotas que visitantes (sem conta) também podem acessar. Token ausente ou
// inválido só significa "sem perfil" (req.user fica undefined); o serviço
// decide o que isso libera (ver SeriesService, já preparado pra profileId
// undefined).
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<OptionallyAuthenticatedRequest>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

    if (!token) return true;

    try {
      request.user = verifyAccessToken(token);
    } catch {
      // Token presente mas inválido/expirado — trata como visitante em vez de
      // 401, pra não travar quem só perdeu a sessão enquanto navegava.
    }

    return true;
  }
}
