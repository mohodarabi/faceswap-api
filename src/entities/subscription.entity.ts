import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  user_id: string;

  @Index()
  @Column({ type: 'text' })
  rc_user_id: string;

  @Column({ type: 'text', nullable: true })
  rc_subscription_id: string | null;

  @Index()
  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'text' })
  plan_type: string;

  @Column({ type: 'integer', nullable: true })
  credits_per_period: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_credit_grant_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_event_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
