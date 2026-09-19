import { Inject, Injectable } from "@nestjs/common";
import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from "@google/generative-ai";
import { GEMINI_CLIENT } from "./ai.constants";

export interface AiMessageParam {
  role: "user" | "assistant";
  content: string;
}

export interface SendMessageParams {
  model: string;
  system?: string;
  messages: AiMessageParam[];
  maxTokens?: number;
}

export interface SendMessageResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

const DEFAULT_MAX_TOKENS = 1024;

// Força o Gemini a devolver sempre { text: string } em JSON — evita parsear
// texto livre e mantém o contrato { reply } que o controller já expõe.
const RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: { text: { type: SchemaType.STRING } },
  required: ["text"],
};

@Injectable()
export class AiService {
  constructor(@Inject(GEMINI_CLIENT) private readonly gemini: GoogleGenerativeAI) {}

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    if (process.env.AI_STREAMING === "true") {
      throw new Error("AI_STREAMING=true não é suportado ainda — apenas o modo sem streaming está implementado.");
    }

    const model = this.gemini.getGenerativeModel({
      model: params.model,
      systemInstruction: params.system,
    });

    const result = await model.generateContent({
      contents: params.messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      generationConfig: {
        maxOutputTokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const parsed = JSON.parse(result.response.text()) as { text: string };
    const usage = result.response.usageMetadata;

    return {
      text: parsed.text,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
    };
  }
}
