import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCredit } from '../entities/user-credit.entity';
import { CreditsService } from './credits.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserCredit])],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
