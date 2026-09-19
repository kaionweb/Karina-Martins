import { Module } from "@nestjs/common";
import { GamificationController } from "./gamification.controller";
import { StreakCronController } from "./streak-cron.controller";
import { GamificationService } from "./gamification.service";

@Module({
  controllers: [GamificationController, StreakCronController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
