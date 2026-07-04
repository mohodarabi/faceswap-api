import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.ENV || 'dev',
  port: parseInt(process.env.PORT || '8080', 10),
  novitaApiKey: process.env.NOVITA_API_KEY || '',
  revenueCatWebhookSecret: process.env.REVENUECAT_WEBHOOK_SECRET || '',
  maxBodySize: parseInt(String(process.env.MAX_BODY_SIZE || 20 << 20), 10),
}));
