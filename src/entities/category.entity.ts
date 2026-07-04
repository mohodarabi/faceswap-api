import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Index()
  @Column({ type: 'text', default: 'image' })
  type: string;

  @Index()
  @Column({ type: 'integer', default: 0 })
  sort_order: number;
}
