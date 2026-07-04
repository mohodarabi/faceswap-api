import { BadRequestException, Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';

const allowedTypes = ['image', 'video', 'motion_control'];

@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  async list(@Query('type') type?: string) {
    if (type && !allowedTypes.includes(type)) {
      throw new BadRequestException({ error: 'type must be one of: image, video, motion_control' });
    }
    return { categories: await this.categories.list(type) };
  }

  @Post()
  async create(@Body() body: { name?: string; type?: string; sort_order?: number }) {
    if (!body.name) {
      throw new BadRequestException({ error: 'name is required' });
    }
    if (!body.type || !allowedTypes.includes(body.type)) {
      throw new BadRequestException({ error: 'type must be one of: image, video, motion_control' });
    }
    return this.categories.create(body.name, body.type, body.sort_order ?? 0);
  }

  @Patch(':category_id')
  async update(@Param('category_id') id: string, @Body() body: { name?: string; type?: string; sort_order?: number }) {
    const fields: Record<string, unknown> = {};
    if (body.name !== undefined) {
      if (body.name === '') {
        throw new BadRequestException({ error: 'name cannot be empty' });
      }
      fields.name = body.name;
    }
    if (body.type !== undefined) {
      if (!allowedTypes.includes(body.type)) {
        throw new BadRequestException({ error: 'type must be one of: image, video, motion_control' });
      }
      fields.type = body.type;
    }
    if (body.sort_order !== undefined) {
      fields.sort_order = body.sort_order;
    }
    if (Object.keys(fields).length === 0) {
      throw new BadRequestException({ error: 'no fields to update' });
    }
    const row = await this.categories.update(id, fields);
    if (!row) {
      throw new NotFoundException({ error: 'category not found' });
    }
    return row;
  }

  @Delete(':category_id')
  @HttpCode(204)
  async delete(@Param('category_id') id: string) {
    await this.categories.delete(id);
  }
}
