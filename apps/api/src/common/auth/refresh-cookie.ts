import type { CookieOptions } from "express";

/**
 * Constantes compartilhadas do refresh token cookie.
 *
 * Extraídas de auth.controller.ts (REFRESH_COOKIE_NAME/REFRESH_COOKIE_OPTIONS)
 * e auth.service.ts (REFRESH_TOKEN_EXPIRES_IN) para que profiles.controller.ts
 * também reemita o mesmo cookie sem duplicar a definição (Story 10.4).
 */
export const REFRESH_COOKIE_NAME = "refresh_token";

export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/auth",
};

export const REFRESH_TOKEN_EXPIRES_IN = "7d";
