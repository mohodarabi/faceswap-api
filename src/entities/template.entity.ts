import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  category_id: string;

  @Index()
  @Column({ type: 'text' })
  novita_model_id: string;

  @Column({ type: 'text', nullable: true })
  preview_url: string | null;

  @Column({ type: 'integer', default: 1 })
  credit_cost: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
