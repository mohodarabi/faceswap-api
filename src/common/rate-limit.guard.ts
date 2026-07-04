import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class DeviceRateLimitGuard implements CanActivate {
  private readonly devices = new Map<string, number[]>();
  private readonly limit = 5;
  private readonly windowMs = 60_000;

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse<Response>();
    const deviceId = req.header('X-Device-ID');
    if (!deviceId) {
      return true;
    }

    const now = Date.now();
    const cutoff = now - this.windowMs;
    const valid = (this.devices.get(deviceId) || []).filter((ts) => ts > cutoff);
    if (valid.length >= this.limit) {
      const retryAfter = Math.ceil((valid[0] + this.windowMs - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({ error: 'rate limit exceeded' });
      return false;
    }

    valid.push(now);
    this.devices.set(deviceId, valid);
    return true;
  }
}
