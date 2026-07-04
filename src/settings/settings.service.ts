import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from '../entities/app-setting.entity';

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(AppSetting) private readonly repo: Repository<AppSetting>) {}

  async get(key: string, defaultValue: string): Promise<string> {
    const row = await this.repo.findOne({ where: { key } });
    return row?.value ?? defaultValue;
  }

  async getInt(key: string, defaultValue: number): Promise<number> {
    const value = await this.get(key, '');
    if (!value) {
      return defaultValue;
    }
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }

  async set(key: string, value: string): Promise<void> {
    await this.repo.upsert({ key, value }, ['key']);
  }

  async ping(): Promise<void> {
    await this.get('_ping', '');
  }
}
