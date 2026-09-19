import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { apiErrorBody } from "../errors/api-error";

@Injectable()
export class CronSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secret = request.headers["x-cron-secret"];

    if (!secret || secret !== process.env.CRON_SECRET) {
      throw new UnauthorizedException(apiErrorBody("INVALID_CRON_SECRET", "Header X-Cron-Secret ausente ou inválido"));
    }

    return true;
  }
}
