import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';

export type SubscriptionUpsert = {
  user_id: string;
  rc_user_id: string;
  rc_subscription_id?: string | null;
  status: string;
  plan_type: string;
  credits_per_period?: number | null;
  last_credit_grant_at?: Date | null;
  expires_at?: Date | null;
  last_event_at?: Date | null;
};

@Injectable()
export class SubscriptionsService {
  constructor(@InjectRepository(Subscription) private readonly repo: Repository<Subscription>) {}

  getActiveByUserId(userId: string): Promise<Subscription | null> {
    return this.repo.findOne({ where: { user_id: userId, status: In(['active', 'grace_period']) } });
  }

  getByRcUserId(rcUserId: string): Promise<Subscription | null> {
    return this.repo.findOne({ where: { rc_user_id: rcUserId } });
  }

  async upsert(row: SubscriptionUpsert): Promise<Subscription> {
    const existing = await this.getByRcUserId(row.rc_user_id);
    const entity = this.repo.create({ ...(existing || {}), ...row });
    return this.repo.save(entity);
  }

  async updateStatus(id: string, status: string, expiresAt?: Date | null, lastEventAt?: Date | null): Promise<void> {
    const fields: Partial<Subscription> = { status };
    if (expiresAt !== undefined && expiresAt !== null) {
      fields.expires_at = expiresAt;
    }
    if (lastEventAt !== undefined && lastEventAt !== null) {
      fields.last_event_at = lastEventAt;
    }
    await this.repo.update({ id }, fields);
  }
}
