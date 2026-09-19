import * as jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  sub: string;
  profileId?: string;
}

type ExpiresIn = jwt.SignOptions["expiresIn"];

export function signAccessToken(payload: AccessTokenPayload, expiresIn: ExpiresIn): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, { expiresIn });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as AccessTokenPayload;
}

export function signRefreshToken(payload: AccessTokenPayload, expiresIn: ExpiresIn): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, { expiresIn });
}

export function verifyRefreshToken(token: string): AccessTokenPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as AccessTokenPayload;
}
