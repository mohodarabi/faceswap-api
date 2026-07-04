import { BadRequestException, Body, Controller, Get, Headers, NotFoundException, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { CreditsService } from '../credits/credits.service';
import { SettingsService } from '../settings/settings.service';
import { UsersService } from './users.service';

@Controller('api/v1/users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly credits: CreditsService,
    private readonly settings: SettingsService,
  ) {}

  @Post()
  async getOrCreate(@Body() body: { 'X-Device-ID'?: string; onboarding_answers?: unknown }, @Res({ passthrough: true }) res: Response) {
    const deviceId = body['X-Device-ID'];
    if (!deviceId) {
      throw new BadRequestException({ error: 'X-Device-ID header required' });
    }
    const existing = await this.users.getByDeviceId(deviceId);
    if (existing) {
      res.status(200);
      return existing;
    }
    const user = await this.users.create(deviceId, body.onboarding_answers);
    const initialCredits = await this.settings.getInt('initial_credits', 5);
    await this.credits.addCredits(user.id, initialCredits).catch(() => undefined);
    res.status(201);
    return user;
  }

  @Get('me/credits')
  async getCredits(@Headers('x-device-id') deviceId?: string) {
    if (!deviceId) {
      throw new BadRequestException({ error: 'X-Device-ID header required' });
    }
    const user = await this.users.getByDeviceId(deviceId);
    if (!user) {
      throw new NotFoundException({ error: 'user not found' });
    }
    const credits = await this.credits.getByUserId(user.id);
    return { balance: credits?.balance ?? 0 };
  }
}
