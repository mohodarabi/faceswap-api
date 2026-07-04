import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'text', unique: true })
  task_id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

  @Index()
  @Column({ type: 'text' })
  endpoint: string;

  @Column({ type: 'text', default: 'TASK_STATUS_QUEUED' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  request_metadata: unknown;

  @Column({ type: 'jsonb', nullable: true })
  response_payload: unknown;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
