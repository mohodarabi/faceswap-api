import { BadRequestException, Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { MediaService, MemoryFile } from '../media/media.service';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto } from './templates.dto';

const { memoryStorage } = require('multer') as { memoryStorage: () => unknown };

@Controller('api/v1')
@ApiTags('Templates')
export class TemplatesController {
  constructor(
    private readonly templates: TemplatesService,
    private readonly media: MediaService,
  ) {}

  @Get('categories/:category_id/templates')
  async list(@Param('category_id') categoryId: string) {
    return { templates: await this.templates.listByCategoryId(categoryId) };
  }

  @Post('categories/:category_id/templates')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateTemplateDto })
  @UseInterceptors(FileInterceptor('preview_file', { storage: memoryStorage(), limits: { fileSize: 50 << 20 } }))
  async create(
    @Param('category_id') categoryId: string,
    @Body() body: CreateTemplateDto,
    @UploadedFile() previewFile: MemoryFile,
    @Req() req: Request,
  ) {
    if (!body.novita_model_id) {
      throw new BadRequestException({ error: 'novita_model_id is required' });
    }

    if (!previewFile) {
      throw new BadRequestException({ error: 'file is required' });
    }

    const storedPreview = await this.media.storeUpload(previewFile, 'templates');
    const previewUrl = this.media.publicUrl(req, storedPreview.relativePath);
    return this.templates.create(categoryId, body.novita_model_id, previewUrl, this.toNumber(body.credit_cost, 0));
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateTemplateDto })
  @UseInterceptors(FileInterceptor('preview_file', { storage: memoryStorage(), limits: { fileSize: 50 << 20 } }))
  async update(
    @Param('template_id') templateId: string,
    @Body() body: UpdateTemplateDto,
    @UploadedFile() previewFile: MemoryFile,
    @Req() req: Request,
  ) {
    const fields: Record<string, unknown> = {};
    if (body.novita_model_id !== undefined) {
      if (body.novita_model_id === '') {
        throw new BadRequestException({ error: 'novita_model_id cannot be empty' });
      }
      fields.novita_model_id = body.novita_model_id;
    }
    if (previewFile) {
      const storedPreview = await this.media.storeUpload(previewFile, 'templates');
      fields.preview_url = this.media.publicUrl(req, storedPreview.relativePath);
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
    const row = await this.templates.getById(templateId);
    if (!row) {
      throw new NotFoundException({ error: 'template not found' });
    }
    await this.templates.delete(templateId);
    await this.media.deletePublicUrl(row.preview_url);
  }

  private toNumber(value: number | string | undefined, fallback: number): number {
    if (value === undefined || value === '') {
      return fallback;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException({ error: 'credit_cost must be numeric' });
    }
    return parsed;
  }
}
