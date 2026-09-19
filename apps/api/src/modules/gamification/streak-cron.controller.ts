import { Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { CronSecretGuard } from "../../common/guards/cron-secret.guard";
import { GamificationService } from "./gamification.service";

@UseGuards(CronSecretGuard)
@Controller("internal/cron")
export class StreakCronController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Post("streak")
  @HttpCode(200)
  updateStreaks() {
    return this.gamificationService.updateStreaks();
  }
}
