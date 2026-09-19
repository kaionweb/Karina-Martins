import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { prisma } from "@ipp/database";
import { AppModule } from "../../src/app.module";

describe("Catalog (Story 2.2)", () => {
  let app: INestApplication;
  const testTitle = `story-2.2-show-${Date.now()}`;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await prisma.show.create({
      data: { title: testTitle, synopsis: "Sinopse original de teste.", thumbnailKey: "design-system/thumb-02" },
    });
  });

  afterAll(async () => {
    await prisma.show.deleteMany({ where: { title: testTitle } });
    await prisma.$disconnect();
    await app.close();
  });

  it("GET /catalog/shows responde 200 sem token (endpoint público, AC1)", async () => {
    const res = await request(app.getHttpServer()).get("/catalog/shows").expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const created = res.body.find((show: { title: string }) => show.title === testTitle);
    expect(created).toBeDefined();
    expect(created.synopsis).toBe("Sinopse original de teste.");
    expect(created.thumbnailKey).toBe("design-system/thumb-02");
  });
});
