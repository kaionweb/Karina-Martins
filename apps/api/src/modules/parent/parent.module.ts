import { Module } from "@nestjs/common";
import { GamificationModule } from "../gamification/gamification.module";
import { ProfilesModule } from "../profiles/profiles.module";
import { ParentController } from "./parent.controller";
import { ParentService } from "./parent.service";

@Module({
  imports: [GamificationModule, ProfilesModule],
  controllers: [ParentController],
  providers: [ParentService],
})
export class ParentModule {}
