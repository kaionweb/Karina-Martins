import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

export function buildCorsOptions(): CorsOptions {
  const origin = process.env.WEB_URL;

  if (!origin) {
    throw new Error("WEB_URL não configurada — obrigatória para restringir CORS à origin do front-end oficial");
  }

  return { origin, credentials: true };
}
