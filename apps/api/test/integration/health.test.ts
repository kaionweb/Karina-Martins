import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";

describe("Health (Story 1.5)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health responde 200 com { status: 'ok' } (AC2)", async () => {
    const res = await request(app.getHttpServer()).get("/health").expect(200);

    expect(res.body).toEqual({ status: "ok" });
  });
});
