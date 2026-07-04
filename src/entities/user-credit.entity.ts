import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_credits')
export class UserCredit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @Column({ type: 'integer', default: 0 })
  balance: number;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  last_updated: Date;
}
