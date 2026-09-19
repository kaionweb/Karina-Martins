import { Test, TestingModule } from "@nestjs/testing";
import { AiModule } from "../../src/modules/ai/ai.module";
import { AiService } from "../../src/modules/ai/ai.service";
import { GEMINI_CLIENT } from "../../src/modules/ai/ai.constants";

describe("AiService (Story 4.1)", () => {
  const originalStreamingFlag = process.env.AI_STREAMING;

  let service: AiService;
  let generateContentMock: jest.Mock;
  let getGenerativeModelMock: jest.Mock;

  beforeEach(async () => {
    process.env.AI_STREAMING = "false";
    generateContentMock = jest.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify({ text: "Hello!" }),
        usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 4 },
      },
    });
    getGenerativeModelMock = jest.fn().mockReturnValue({ generateContent: generateContentMock });

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AiModule],
    })
      .overrideProvider(GEMINI_CLIENT)
      .useValue({ getGenerativeModel: getGenerativeModelMock })
      .compile();

    service = moduleRef.get(AiService);
  });

  afterAll(() => {
    process.env.AI_STREAMING = originalStreamingFlag;
  });

  it("chama o SDK sem streaming e repassa model/system/messages/max_tokens", async () => {
    const result = await service.sendMessage({
      model: "gemini-2.5-flash",
      system: "Responda só em inglês.",
      messages: [{ role: "user", content: "Hi" }],
      maxTokens: 256,
    });

    expect(getGenerativeModelMock).toHaveBeenCalledWith({
      model: "gemini-2.5-flash",
      systemInstruction: "Responda só em inglês.",
    });
    expect(generateContentMock).toHaveBeenCalledWith({
      contents: [{ role: "user", parts: [{ text: "Hi" }] }],
      generationConfig: expect.objectContaining({
        maxOutputTokens: 256,
        responseMimeType: "application/json",
      }),
    });
    expect(result).toEqual({ text: "Hello!", inputTokens: 12, outputTokens: 4 });
  });

  it("usa max_tokens=1024 por padrão quando não informado", async () => {
    await service.sendMessage({ model: "gemini-2.5-flash", messages: [{ role: "user", content: "Hi" }] });

    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({ generationConfig: expect.objectContaining({ maxOutputTokens: 1024 }) }),
    );
  });

  it("lança erro e NÃO chama o SDK quando AI_STREAMING=true", async () => {
    process.env.AI_STREAMING = "true";

    await expect(
      service.sendMessage({ model: "gemini-2.5-flash", messages: [{ role: "user", content: "Hi" }] }),
    ).rejects.toThrow("AI_STREAMING=true não é suportado ainda");
    expect(generateContentMock).not.toHaveBeenCalled();
  });
});
