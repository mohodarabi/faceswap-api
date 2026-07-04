export function validateConfig(config: Record<string, unknown>) {
  const missing = ['NOVITA_API_KEY', 'REVENUECAT_WEBHOOK_SECRET'].filter((key) => !config[key]);
  if (!config.DATABASE_URL && !config.POSTGRES_HOST) {
    missing.push('DATABASE_URL or POSTGRES_HOST');
  }
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
  const port = Number(config.PORT || 8080);
  if (!Number.isInteger(port)) {
    throw new Error(`PORT must be numeric, got ${config.PORT}`);
  }
  return config;
}
