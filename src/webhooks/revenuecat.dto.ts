import { ApiPropertyOptional } from '@nestjs/swagger';

export class RevenueCatEventDto {
  @ApiPropertyOptional()
  type?: string;

  @ApiPropertyOptional()
  app_user_id?: string;

  @ApiPropertyOptional()
  product_id?: string;

  @ApiPropertyOptional()
  expiration_at_ms?: number;

  @ApiPropertyOptional()
  event_timestamp_ms?: number;

  @ApiPropertyOptional()
  period_type?: string;

  @ApiPropertyOptional({ type: [String] })
  entitlement_ids?: string[];

  @ApiPropertyOptional()
  original_app_user_id?: string;
}

export class RevenueCatWebhookDto {
  @ApiPropertyOptional({ type: RevenueCatEventDto })
  event?: RevenueCatEventDto;
}
