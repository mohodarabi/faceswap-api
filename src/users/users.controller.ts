import { BadRequestException, Body, Controller, Get, Headers, NotFoundException, Post, Res } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CreditsService } from '../credits/credits.service';
import { SettingsService } from '../settings/settings.service';
import { CreditBalanceDto, GetOrCreateUserDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('api/v1/users')
@ApiTags('Users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly credits: CreditsService,
    private readonly settingsService: SettingsService,
  ) {}

  @Post()
  async getOrCreate(@Body() body: GetOrCreateUserDto, @Res({ passthrough: true }) res: Response) {
    const deviceId = body['X-Device-ID'];
    if (!deviceId) {
      throw new BadRequestException({ error: 'X-Device-ID header required' });
    }
    const existing = await this.usersService.getByDeviceId(deviceId);
    if (existing) {
      res.status(200);
      return existing;
    }
    const user = await this.usersService.create(deviceId, body.onboarding_answers);
    const initialCredits = await this.settingsService.getInt('initial_credits', 5);
    await this.credits.addCredits(user.id, initialCredits).catch(() => undefined);
    res.status(201);
    return user;
  }

  @Get('me/credits')
  @ApiOkResponse({ type: CreditBalanceDto })
  async getCredits(@Headers('x-device-id') deviceId?: string) {
    if (!deviceId) {
      throw new BadRequestException({ error: 'X-Device-ID header required' });
    }
    const user = await this.usersService.getByDeviceId(deviceId);
    if (!user) {
      throw new NotFoundException({ error: 'user not found' });
    }
    const credits = await this.credits.getByUserId(user.id);
    return { balance: credits?.balance ?? 0 };
  }
}
