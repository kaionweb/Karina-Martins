import { Body, Controller, ForbiddenException, HttpCode, HttpException, HttpStatus, Logger, Post, Req, UseGuards, UsePipes } from "@nestjs/common";
import { ChatEnSchema, ChatPtSchema, type ChatEnInput, type ChatPtInput } from "@ipp/shared";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { apiErrorBody } from "../../common/errors/api-error";
import { LessonsService } from "../lessons/lessons.service";
import { ProfilesService } from "../profiles/profiles.service";
import { AiService, type SendMessageResult } from "./ai.service";
import { AiUsageService } from "./ai-usage.service";
import {
  buildEnglishTutorSystemPrompt,
  buildEnglishTutorSystemPromptForScenario,
  buildPortugueseAssistantSystemPrompt,
} from "./ai.prompts";
import { checkContentSafety, SAFE_FALLBACK_REPLY_EN, SAFE_FALLBACK_REPLY_PT } from "./ai.content-filter";

// Tier gratuito do Gemini: mesmo modelo para os dois papéis, pra caber no
// orçamento de 1.500 requisições/dia sem depender de um modelo "pro" com quota menor.
// gemini-2.5-flash está desativado pra novas chaves (confirmado ao vivo contra a API
// em 2026-09-02: 404 "no longer available to new users") — Google recomenda gemini-3.6-flash.
const ENGLISH_TUTOR_MODEL = "gemini-3.6-flash";
const PORTUGUESE_ASSISTANT_MODEL = "gemini-3.6-flash";

// Kai nunca deixa a criança sem resposta — se o Gemini cair (rede, quota,
// modelo indisponível), devolve 200 com uma fala em personagem em vez de
// deixar o 500 cru estourar pro front.
const AI_UNAVAILABLE_FALLBACK_EN = "Oops! I'm taking a little break. Try again in a moment! 🙂";
const AI_UNAVAILABLE_FALLBACK_PT = "Ops! A Kai tirou uma pausinha rapidinha. Tenta de novo daqui a pouco! 🙂";

@UseGuards(JwtAuthGuard)
@Controller("ai")
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly lessonsService: LessonsService,
    private readonly profilesService: ProfilesService,
    private readonly aiUsageService: AiUsageService,
  ) {}

  @Post("chat/en")
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(ChatEnSchema))
  async chatEn(@Body() body: ChatEnInput, @Req() req: AuthenticatedRequest) {
    const profileId = this.requireActiveProfile(req);
    await this.enforceDailyLimit(profileId);

    const system = body.lessonId
      ? buildEnglishTutorSystemPrompt(await this.lessonsService.getLesson(body.lessonId))
      : buildEnglishTutorSystemPromptForScenario(body.scenario!);

    const result = await this.sendMessageOrFallback({
      model: ENGLISH_TUTOR_MODEL,
      system,
      messages: [{ role: "user", content: body.message }],
    });

    if (!result) {
      return { reply: AI_UNAVAILABLE_FALLBACK_EN };
    }

    const { reply, flaggedByFilter } = await this.applyContentFilter(profileId, result.text, SAFE_FALLBACK_REPLY_EN);

    await this.aiUsageService.recordInteraction({
      profileId,
      lessonId: body.lessonId ?? null,
      language: "EN",
      userMessage: body.message,
      assistantContent: reply,
      promptTokens: result.inputTokens,
      completionTokens: result.outputTokens,
      flaggedByFilter,
    });

    return { reply };
  }

  @Post("chat/pt")
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(ChatPtSchema))
  async chatPt(@Body() body: ChatPtInput, @Req() req: AuthenticatedRequest) {
    const profileId = this.requireActiveProfile(req);
    await this.enforceDailyLimit(profileId);

    const lesson = body.lessonId ? await this.lessonsService.getLesson(body.lessonId) : null;
    const system = buildPortugueseAssistantSystemPrompt(lesson);

    const result = await this.sendMessageOrFallback({
      model: PORTUGUESE_ASSISTANT_MODEL,
      system,
      messages: [{ role: "user", content: body.message }],
    });

    if (!result) {
      return { reply: AI_UNAVAILABLE_FALLBACK_PT };
    }

    const { reply, flaggedByFilter } = await this.applyContentFilter(profileId, result.text, SAFE_FALLBACK_REPLY_PT);

    await this.aiUsageService.recordInteraction({
      profileId,
      lessonId: body.lessonId ?? null,
      language: "PT",
      userMessage: body.message,
      assistantContent: reply,
      promptTokens: result.inputTokens,
      completionTokens: result.outputTokens,
      flaggedByFilter,
    });

    return { reply };
  }

  private requireActiveProfile(req: AuthenticatedRequest): string {
    if (!req.user.profileId) {
      throw new ForbiddenException(apiErrorBody("NO_ACTIVE_PROFILE", "Nenhum perfil ativo selecionado"));
    }

    return req.user.profileId;
  }

  private async enforceDailyLimit(profileId: string): Promise<void> {
    if (await this.aiUsageService.isDailyLimitReached(profileId)) {
      throw new HttpException(
        apiErrorBody("AI_DAILY_LIMIT_REACHED", "Limite diário de mensagens de IA atingido"),
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async sendMessageOrFallback(
    params: Parameters<AiService["sendMessage"]>[0],
  ): Promise<SendMessageResult | null> {
    try {
      return await this.aiService.sendMessage(params);
    } catch (err) {
      this.logger.error("Falha ao chamar o Gemini", err instanceof Error ? err.stack : String(err));
      return null;
    }
  }

  private async applyContentFilter(
    profileId: string,
    text: string,
    safeFallbackReply: string,
  ): Promise<{ reply: string; flaggedByFilter: boolean }> {
    if (!(await this.profilesService.isChildProfile(profileId))) {
      return { reply: text, flaggedByFilter: false };
    }

    const { approved } = checkContentSafety(text);
    return approved ? { reply: text, flaggedByFilter: false } : { reply: safeFallbackReply, flaggedByFilter: true };
  }
}
