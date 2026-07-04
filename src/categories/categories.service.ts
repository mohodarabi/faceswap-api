import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private readonly repo: Repository<Category>) {}

  list(type?: string): Promise<Category[]> {
    return this.repo.find({
      where: type ? { type } : {},
      order: { sort_order: 'ASC' },
    });
  }

  create(name: string, type: string, sortOrder: number): Promise<Category> {
    return this.repo.save(this.repo.create({ name, type, sort_order: sortOrder }));
  }

  async update(id: string, fields: Partial<Category>): Promise<Category | null> {
    await this.repo.update({ id }, fields);
    return this.repo.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
