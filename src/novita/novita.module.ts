import { Module } from '@nestjs/common';
import { NovitaService } from './novita.service';

@Module({
  providers: [NovitaService],
  exports: [NovitaService],
})
export class NovitaModule {}
