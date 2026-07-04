import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CreditsModule } from '../credits/credits.module';
import { SettingsModule } from '../settings/settings.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UsersModule } from '../users/users.module';
import { RevenueCatController } from './revenuecat.controller';

@Module({
  imports: [ConfigModule, UsersModule, SubscriptionsModule, CreditsModule, SettingsModule],
  controllers: [RevenueCatController],
})
export class WebhooksModule {}
