import { Module } from "@nestjs/common";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LessonsModule } from "../lessons/lessons.module";
import { ProfilesModule } from "../profiles/profiles.module";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { AiUsageService } from "./ai-usage.service";
import { GEMINI_CLIENT } from "./ai.constants";

@Module({
  imports: [LessonsModule, ProfilesModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiUsageService,
    {
      provide: GEMINI_CLIENT,
      useFactory: () => new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? ""),
    },
  ],
  exports: [AiService],
})
export class AiModule {}
