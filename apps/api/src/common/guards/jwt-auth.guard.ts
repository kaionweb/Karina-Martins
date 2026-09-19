import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { verifyAccessToken, type AccessTokenPayload } from "../auth/jwt.util";
import { apiErrorBody } from "../errors/api-error";

export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

    if (!token) {
      throw new UnauthorizedException(apiErrorBody("MISSING_ACCESS_TOKEN", "Token de acesso ausente"));
    }

    try {
      request.user = verifyAccessToken(token);
      return true;
    } catch {
      throw new UnauthorizedException(apiErrorBody("INVALID_ACCESS_TOKEN", "Token de acesso inválido ou expirado"));
    }
  }
}
