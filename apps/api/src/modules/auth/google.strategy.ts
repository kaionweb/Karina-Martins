import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, type Profile, type VerifyCallback } from "passport-google-oauth20";
import { apiErrorBody } from "../../common/errors/api-error";
import { GoogleOAuthStateStore } from "./google-oauth-state.store";

export interface GoogleUserPayload {
  googleId: string;
  email: string;
  emailVerified: boolean;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
      scope: ["email", "profile"],
      // Store de `state` via cookie (não sessão) — protege contra login CSRF (SEC-003, QA gate 1.3).
      store: new GoogleOAuthStateStore(),
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new UnauthorizedException(apiErrorBody("GOOGLE_EMAIL_MISSING", "Conta Google sem email disponível")), false);
      return;
    }

    const payload: GoogleUserPayload = {
      googleId: profile.id,
      email,
      emailVerified: profile.emails?.[0]?.verified === true,
    };
    done(null, payload);
  }
}
