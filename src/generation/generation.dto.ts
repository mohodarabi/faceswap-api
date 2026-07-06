import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 'invalid request' })
  error: string;
}

export class MergeFaceMultipartDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Face image file (jpg, png, webp; max 10MB)' })
  face_image: unknown;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Target image file (jpg, png, webp; max 10MB)' })
  image: unknown;

  @ApiPropertyOptional({ enum: ['png', 'jpg'], default: 'png' })
  image_type?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  template_id?: string;
}

export class MergeFaceResponseDto {
  @ApiProperty({ format: 'uri', example: 'https://api.example.com/uploads/generated/result.png' })
  image_url: string;

  @ApiProperty({ example: 'png' })
  image_type: string;
}

export class VideoMergeFaceMultipartDto {
  @ApiProperty({ description: 'Novita asset ID for the target video' })
  video_asset_id?: string;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Face image file (jpg, png, webp; max 10MB)' })
  face_image: unknown;

  @ApiPropertyOptional({ format: 'uuid' })
  template_id?: string;
}

export class MotionControlMultipartDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Reference image file (jpg, png, webp; max 10MB)' })
  reference_image: unknown;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Reference video file (mp4, mov, webm; max 50MB)' })
  reference_video: unknown;

  @ApiPropertyOptional({ default: '', maxLength: 2500 })
  positive_prompt?: string;

  @ApiPropertyOptional({ default: '', maxLength: 2500 })
  negative_prompt?: string;

  @ApiPropertyOptional({ default: 'video' })
  character_orientation?: string;

  @ApiPropertyOptional({ default: false })
  keep_original_sound?: boolean | string;

  @ApiPropertyOptional({ format: 'uuid' })
  template_id?: string;
}

export class NovitaTaskDto {
  @ApiProperty()
  task_id: string;

  @ApiProperty({ example: 'TASK_STATUS_PROCESSING' })
  status: string;
}

export class NovitaTaskResultDto {
  @ApiProperty({ type: NovitaTaskDto })
  task: NovitaTaskDto;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object', properties: { video_url: { type: 'string' } } } })
  videos?: Array<{ video_url: string }>;
}
