import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { buildCorsOptions } from "../../src/common/config/cors.config";

describe("CORS (Story 1.5)", () => {
  let app: INestApplication;
  const webUrl = process.env.WEB_URL as string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.enableCors(buildCorsOptions());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("reflete Access-Control-Allow-Origin exatamente igual a WEB_URL para a origin oficial (AC1)", async () => {
    const res = await request(app.getHttpServer()).get("/health").set("Origin", webUrl).expect(200);

    expect(res.headers["access-control-allow-origin"]).toBe(webUrl);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("nunca retorna Access-Control-Allow-Origin igual a uma origin arbitrária/maliciosa nem '*' (AC1)", async () => {
    const maliciousOrigin = "http://evil.example.com";

    const res = await request(app.getHttpServer()).get("/health").set("Origin", maliciousOrigin).expect(200);

    expect(res.headers["access-control-allow-origin"]).not.toBe(maliciousOrigin);
    expect(res.headers["access-control-allow-origin"]).not.toBe("*");
    expect(res.headers["access-control-allow-origin"]).toBe(webUrl);
  });
});

describe("buildCorsOptions() (Story 1.5)", () => {
  const originalWebUrl = process.env.WEB_URL;

  afterEach(() => {
    process.env.WEB_URL = originalWebUrl;
  });

  it("lança erro explícito quando WEB_URL está ausente, em vez de retornar origin: undefined", () => {
    delete process.env.WEB_URL;

    expect(() => buildCorsOptions()).toThrow();
  });

  it("lança erro explícito quando WEB_URL está vazia", () => {
    process.env.WEB_URL = "";

    expect(() => buildCorsOptions()).toThrow();
  });

  it("retorna origin e credentials corretos quando WEB_URL está configurada", () => {
    process.env.WEB_URL = "http://localhost:3000";

    expect(buildCorsOptions()).toEqual({ origin: "http://localhost:3000", credentials: true });
  });
});
