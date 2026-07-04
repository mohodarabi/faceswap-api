import { BadRequestException, Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { TemplatesService } from './templates.service';

@Controller('api/v1')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get('categories/:category_id/templates')
  async list(@Param('category_id') categoryId: string) {
    return { templates: await this.templates.listByCategoryId(categoryId) };
  }

  @Post('categories/:category_id/templates')
  async create(
    @Param('category_id') categoryId: string,
    @Body() body: { novita_model_id?: string; preview_url?: string | null; credit_cost?: number },
  ) {
    if (!body.novita_model_id) {
      throw new BadRequestException({ error: 'novita_model_id is required' });
    }
    return this.templates.create(categoryId, body.novita_model_id, body.preview_url ?? null, body.credit_cost ?? 0);
  }

  @Get('templates/:template_id')
  async get(@Param('template_id') templateId: string) {
    const row = await this.templates.getById(templateId);
    if (!row) {
      throw new NotFoundException({ error: 'template not found' });
    }
    return row;
  }

  @Patch('templates/:template_id')
  async update(
    @Param('template_id') templateId: string,
    @Body() body: { novita_model_id?: string; preview_url?: string | null; credit_cost?: number },
  ) {
    const fields: Record<string, unknown> = {};
    if (body.novita_model_id !== undefined) {
      if (body.novita_model_id === '') {
        throw new BadRequestException({ error: 'novita_model_id cannot be empty' });
      }
      fields.novita_model_id = body.novita_model_id;
    }
    if (body.preview_url !== undefined) {
      fields.preview_url = body.preview_url;
    }
    if (body.credit_cost !== undefined) {
      fields.credit_cost = body.credit_cost;
    }
    if (Object.keys(fields).length === 0) {
      throw new BadRequestException({ error: 'no fields to update' });
    }
    const row = await this.templates.update(templateId, fields);
    if (!row) {
      throw new NotFoundException({ error: 'template not found' });
    }
    return row;
  }

  @Delete('templates/:template_id')
  @HttpCode(204)
  async delete(@Param('template_id') templateId: string) {
    await this.templates.delete(templateId);
  }
}
