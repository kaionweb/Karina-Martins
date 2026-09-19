import * as jwt from "jsonwebtoken";
import {
  signRefreshToken,
  verifyRefreshToken,
  type AccessTokenPayload,
} from "../../src/common/auth/jwt.util";

/**
 * Round-trip unitário de signRefreshToken/verifyRefreshToken (Story 10.4).
 * O comportamento observável (cookies HTTP) é coberto pelos testes de
 * integração; aqui garantimos apenas o contrato do par sign/verify.
 */
describe("jwt.util refresh token (Story 10.4)", () => {
  it("faz round-trip com profileId", () => {
    const token = signRefreshToken({ sub: "user-1", profileId: "profile-1" }, "7d");
    const payload = verifyRefreshToken(token);

    expect(payload.sub).toBe("user-1");
    expect(payload.profileId).toBe("profile-1");
  });

  it("faz round-trip sem profileId (payload legado { sub })", () => {
    const token = signRefreshToken({ sub: "user-2" }, "7d");
    const payload: AccessTokenPayload = verifyRefreshToken(token);

    expect(payload.sub).toBe("user-2");
    expect(payload.profileId).toBeUndefined();
  });

  it("lança para token assinado com secret diferente", () => {
    const token = jwt.sign({ sub: "user-3" }, "secret-completamente-diferente", { expiresIn: "7d" });
    expect(() => verifyRefreshToken(token)).toThrow();
  });

  it("lança para token expirado", () => {
    const token = signRefreshToken({ sub: "user-4" }, "-1s");
    expect(() => verifyRefreshToken(token)).toThrow();
  });
});
