import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

@Controller('health')
export class HealthController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  async health() {
    try {
      await this.settings.ping();
      return { status: 'healthy' };
    } catch {
      throw new ServiceUnavailableException({
        status: 'unhealthy',
        error: 'database unreachable',
      });
    }
  }
}
