import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'text', unique: true })
  device_id: string;

  @Column({ type: 'jsonb', nullable: true })
  onboarding_answers: unknown;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
