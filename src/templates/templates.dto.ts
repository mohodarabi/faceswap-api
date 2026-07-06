import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {MemoryFile} from "../media/media.service";

export class CreateTemplateDto {
  @ApiProperty()
  novita_model_id?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Optional preview image/video file' })
  preview_file?: MemoryFile;

  @ApiPropertyOptional({ default: 0 })
  credit_cost?: number | string;
}

export class UpdateTemplateDto {
  @ApiProperty()
  novita_model_id?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Optional preview image/video file' })
  preview_file?: MemoryFile;

  @ApiPropertyOptional({ default: 0 })
  credit_cost?: number | string;
}
