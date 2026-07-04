import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  getByDeviceId(deviceId: string): Promise<User | null> {
    return this.repo.findOne({ where: { device_id: deviceId } });
  }

  async create(deviceId: string, onboardingAnswers?: unknown): Promise<User> {
    try {
      const user = this.repo.create({
        device_id: deviceId,
        onboarding_answers: onboardingAnswers ?? null,
      });
      return await this.repo.save(user);
    } catch (error) {
      const existing = await this.getByDeviceId(deviceId);
      if (existing) {
        return existing;
      }
      throw error;
    }
  }
}
