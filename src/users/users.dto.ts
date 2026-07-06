import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetOrCreateUserDto {
  @ApiProperty({ name: 'X-Device-ID' })
  'X-Device-ID'?: string;

  @ApiPropertyOptional()
  onboarding_answers?: unknown;
}

export class CreditBalanceDto {
  @ApiProperty()
  balance: number;
}
