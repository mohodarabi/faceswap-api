import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const categoryTypes = ['image', 'video', 'motion_control'] as const;

export class ListCategoriesQueryDto {
  @ApiPropertyOptional({ enum: categoryTypes })
  type?: string;
}

export class CreateCategoryDto {
  @ApiProperty()
  name?: string;

  @ApiProperty({ enum: categoryTypes })
  type?: string;

  @ApiPropertyOptional({ default: 0 })
  sort_order?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ enum: categoryTypes })
  type?: string;

  @ApiPropertyOptional()
  sort_order?: number;
}
