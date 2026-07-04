import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InsufficientCreditsError, CreditsService } from '../credits/credits.service';
import { User } from '../entities/user.entity';
import { PaymentRequiredException } from '../common/http-errors';
import { SettingsService } from '../settings/settings.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class GenerationService {
  constructor(
    private readonly users: UsersService,
    private readonly credits: CreditsService,
    private readonly subscriptions: SubscriptionsService,
    private readonly settings: SettingsService,
  ) {}

  async resolveUser(deviceId?: string): Promise<User> {
    if (!deviceId) {
      throw new BadRequestException({ error: 'X-Device-ID header required' });
    }
    const user = await this.users.getByDeviceId(deviceId);
    if (!user) {
      throw new NotFoundException({ error: 'user not found' });
    }
    return user;
  }

  async deductCredits(userId: string): Promise<number> {
    const sub = await this.subscriptions.getActiveByUserId(userId);
    if (sub?.plan_type === 'unlimited') {
      return 0;
    }
    const cost = await this.settings.getInt('default_credit_cost', 1);
    if (cost === 0) {
      return 0;
    }
    try {
      await this.credits.deduct(userId, cost);
      return cost;
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        throw new PaymentRequiredException();
      }
      throw new InternalServerErrorException({ error: error instanceof Error ? error.message : String(error) });
    }
  }

  async refundIfNeeded(userId: string, cost: number): Promise<void> {
    if (cost > 0) {
      await this.credits.refund(userId, cost).catch(() => undefined);
    }
  }

  newSyncTaskId(): string {
    return `sync-${randomBytes(16).toString('hex')}`;
  }
}
