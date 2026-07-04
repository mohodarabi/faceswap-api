import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from '../entities/template.entity';

@Injectable()
export class TemplatesService {
  constructor(@InjectRepository(Template) private readonly repo: Repository<Template>) {}

  listByCategoryId(categoryId: string): Promise<Template[]> {
    return this.repo.find({
      where: { category_id: categoryId },
      order: { created_at: 'ASC' },
    });
  }

  getById(id: string): Promise<Template | null> {
    return this.repo.findOne({ where: { id } });
  }

  create(categoryId: string, novitaModelId: string, previewUrl: string | null, creditCost: number): Promise<Template> {
    return this.repo.save(
      this.repo.create({
        category_id: categoryId,
        novita_model_id: novitaModelId,
        preview_url: previewUrl,
        credit_cost: creditCost,
      }),
    );
  }

  async update(id: string, fields: Partial<Template>): Promise<Template | null> {
    await this.repo.update({ id }, fields);
    return this.repo.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
