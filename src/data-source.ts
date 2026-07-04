import 'dotenv/config';
import { DataSource } from 'typeorm';
import { AppSetting } from './entities/app-setting.entity';
import { Category } from './entities/category.entity';
import { Subscription } from './entities/subscription.entity';
import { Task } from './entities/task.entity';
import { Template } from './entities/template.entity';
import { UserCredit } from './entities/user-credit.entity';
import { User } from './entities/user.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : process.env.POSTGRES_HOST || 'localhost',
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.DATABASE_URL ? undefined : process.env.POSTGRES_USER || 'postgres',
  password: process.env.DATABASE_URL ? undefined : process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.DATABASE_URL ? undefined : process.env.POSTGRES_DB || 'faceswap',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [User, UserCredit, Subscription, Category, Template, Task, AppSetting],
  migrations: ['migrations/*.ts'],
  synchronize: false,
});
