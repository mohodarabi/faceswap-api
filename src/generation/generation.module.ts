import { Module } from '@nestjs/common';
import { CreditsModule } from '../credits/credits.module';
import { NovitaModule } from '../novita/novita.module';
import { SettingsModule } from '../settings/settings.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TasksModule } from '../tasks/tasks.module';
import { TemplatesModule } from '../templates/templates.module';
import { UsersModule } from '../users/users.module';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';
import { DeviceRateLimitGuard } from '../common/rate-limit.guard';

@Module({
  imports: [UsersModule, CreditsModule, SubscriptionsModule, SettingsModule, TemplatesModule, TasksModule, NovitaModule],
  controllers: [GenerationController],
  providers: [GenerationService, DeviceRateLimitGuard],
})
export class GenerationModule {}
