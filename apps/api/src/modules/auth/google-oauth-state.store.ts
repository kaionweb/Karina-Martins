import * as crypto from "crypto";
import type { Request, Response } from "express";

/**
 * Store de `state` OAuth2 baseado em cookie (não em sessão de servidor), para
 * respeitar NFR1 (API sem estado em memória entre requests). Mitiga login CSRF
 * (SEC-003, QA gate 1.3): sem isso, `passport-oauth2` cai no NullStore, que
 * aceita qualquer callback sem validar nada.
 */
const STATE_COOKIE = "oauth_state";
const STATE_COOKIE_PATH = "/auth/google";
const STATE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

type StoreCallback = (err: Error | null, state?: string) => void;
type VerifyCallback = (err: Error | null, ok: boolean) => void;

export class GoogleOAuthStateStore {
  store(req: Request, callback: StoreCallback): void {
    const state = crypto.randomBytes(16).toString("hex");
    const res = req.res as Response;
    res.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: STATE_COOKIE_MAX_AGE_MS,
      path: STATE_COOKIE_PATH,
    });
    callback(null, state);
  }

  verify(req: Request, providedState: string, callback: VerifyCallback): void {
    const cookieState = (req.cookies as Record<string, string> | undefined)?.[STATE_COOKIE];
    const res = req.res as Response;
    res.clearCookie(STATE_COOKIE, { path: STATE_COOKIE_PATH });
    callback(null, Boolean(cookieState) && cookieState === providedState);
  }
}
