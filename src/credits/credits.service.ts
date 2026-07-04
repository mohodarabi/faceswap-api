import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserCredit } from '../entities/user-credit.entity';

export class InsufficientCreditsError extends Error {
  constructor() {
    super('insufficient credits');
  }
}

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(UserCredit) private readonly repo: Repository<UserCredit>,
    private readonly dataSource: DataSource,
  ) {}

  getByUserId(userId: string): Promise<UserCredit | null> {
    return this.repo.findOne({ where: { user_id: userId } });
  }

  async deduct(userId: string, amount: number): Promise<number> {
    const result = await this.dataSource.query(
      `UPDATE user_credits
       SET balance = balance - $2, last_updated = now()
       WHERE user_id = $1 AND balance >= $2
       RETURNING balance`,
      [userId, amount],
    );
    if (result.length === 0) {
      throw new InsufficientCreditsError();
    }
    return Number(result[0].balance);
  }

  async refund(userId: string, amount: number): Promise<number> {
    const result = await this.dataSource.query(
      `UPDATE user_credits
       SET balance = balance + $2, last_updated = now()
       WHERE user_id = $1
       RETURNING balance`,
      [userId, amount],
    );
    if (result.length === 0) {
      throw new Error('user_credits_not_found');
    }
    return Number(result[0].balance);
  }

  async addCredits(userId: string, amount: number): Promise<number> {
    const result = await this.dataSource.query(
      `INSERT INTO user_credits (user_id, balance, last_updated)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id) DO UPDATE
       SET balance = user_credits.balance + $2, last_updated = now()
       RETURNING balance`,
      [userId, amount],
    );
    return Number(result[0].balance);
  }
}
