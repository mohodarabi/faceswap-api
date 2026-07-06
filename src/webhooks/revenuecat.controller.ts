import { Body, Controller, Headers, HttpCode, Post, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { CreditsService } from '../credits/credits.service';
import { SettingsService } from '../settings/settings.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UsersService } from '../users/users.service';
import { RevenueCatWebhookDto } from './revenuecat.dto';

@Controller('api/v1/webhooks/revenuecat')
@ApiTags('Webhooks')
export class RevenueCatController {
  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly subscriptions: SubscriptionsService,
    private readonly credits: CreditsService,
    private readonly settings: SettingsService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(@Headers('authorization') authorization: string | undefined, @Body() body: RevenueCatWebhookDto) {
    const secret = this.config.get<string>('app.revenueCatWebhookSecret') || '';
    if (secret && authorization !== `Bearer ${secret}`) {
      throw new UnauthorizedException({ error: 'unauthorized' });
    }

    const event = body.event || {};
    if (!event.app_user_id) {
      throw new BadRequestException({ error: 'missing app_user_id' });
    }
    const user = await this.users.getByDeviceId(event.app_user_id);
    if (!user) {
      return { received: true, note: 'user not found' };
    }

    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL': {
        if (event.type === 'INITIAL_PURCHASE') {
          const existing = await this.subscriptions.getActiveByUserId(user.id);
          if (existing) {
            return { received: true };
          }
        }
        const [planType, creditsPerPeriod] = this.parsePlanFromProduct(event.product_id || '');
        const now = new Date();
        const eventTime = this.formatEventTimestamp(event.event_timestamp_ms);
        await this.subscriptions.upsert({
          user_id: user.id,
          rc_user_id: event.app_user_id,
          status: 'active',
          plan_type: planType,
          credits_per_period: creditsPerPeriod > 0 ? creditsPerPeriod : null,
          last_credit_grant_at: creditsPerPeriod > 0 ? now : null,
          expires_at: this.formatEventTimestamp(event.expiration_at_ms),
          last_event_at: eventTime,
        });
        if (creditsPerPeriod > 0) {
          await this.credits.addCredits(user.id, creditsPerPeriod).catch(() => undefined);
        }
        break;
      }
      case 'NON_RENEWING_PURCHASE': {
        const credits = await this.parseTopUpCredits(event.product_id || '');
        if (credits > 0) {
          try {
            await this.credits.addCredits(user.id, credits);
          } catch {
            throw new InternalServerErrorException({ error: 'failed to add credits' });
          }
        }
        break;
      }
      case 'CANCELLATION':
      case 'EXPIRATION': {
        const sub = await this.subscriptions.getByRcUserId(event.app_user_id);
        if (sub) {
          const eventTime = this.formatEventTimestamp(event.event_timestamp_ms);
          if (sub.last_event_at && eventTime && eventTime.getTime() < sub.last_event_at.getTime()) {
            break;
          }
          await this.subscriptions.updateStatus(sub.id, event.type === 'CANCELLATION' ? 'canceled' : 'expired', null, eventTime);
        }
        break;
      }
    }

    return { received: true };
  }

  private parsePlanFromProduct(productId: string): [string, number] {
    switch (productId) {
      case 'unlimited_monthly':
      case 'unlimited_yearly':
        return ['unlimited', 0];
      default:
        return ['premium', 50];
    }
  }

  private async parseTopUpCredits(productId: string): Promise<number> {
    switch (productId) {
      case 'credits_10':
        return 10;
      case 'credits_25':
        return 25;
      case 'credits_50':
        return 50;
      case 'credits_100':
        return 100;
      default:
        return this.settings.getInt(`topup_credits_${productId}`, 0);
    }
  }

  private formatEventTimestamp(ms?: number): Date | null {
    return ms ? new Date(ms) : null;
  }
}
