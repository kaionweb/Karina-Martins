import { Module } from "@nestjs/common";
import { GamificationModule } from "../gamification/gamification.module";
import { LessonsController } from "./lessons.controller";
import { LessonsService } from "./lessons.service";

@Module({
  imports: [GamificationModule],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
