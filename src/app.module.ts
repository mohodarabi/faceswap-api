import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { validateConfig } from './config/validate-config';
import { AppSetting } from './entities/app-setting.entity';
import { Category } from './entities/category.entity';
import { Subscription } from './entities/subscription.entity';
import { Task } from './entities/task.entity';
import { Template } from './entities/template.entity';
import { UserCredit } from './entities/user-credit.entity';
import { User } from './entities/user.entity';
import { CategoriesModule } from './categories/categories.module';
import { CreditsModule } from './credits/credits.module';
import { GenerationModule } from './generation/generation.module';
import { HealthModule } from './health/health.module';
import { NovitaModule } from './novita/novita.module';
import { SettingsModule } from './settings/settings.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TasksModule } from './tasks/tasks.module';
import { TemplatesModule } from './templates/templates.module';
import { UsersModule } from './users/users.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      validate: validateConfig,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('database.url'),
        host: config.get<string>('database.url') ? undefined : config.get<string>('database.host'),
        port: config.get<string>('database.url') ? undefined : config.get<number>('database.port'),
        username: config.get<string>('database.url') ? undefined : config.get<string>('database.username'),
        password: config.get<string>('database.url') ? undefined : config.get<string>('database.password'),
        database: config.get<string>('database.url') ? undefined : config.get<string>('database.database'),
        ssl: config.get<boolean>('database.ssl') ? { rejectUnauthorized: false } : false,
        entities: [User, UserCredit, Subscription, Category, Template, Task, AppSetting],
        synchronize: false,
      }),
    }),
    SettingsModule,
    UsersModule,
    CreditsModule,
    SubscriptionsModule,
    TasksModule,
    TemplatesModule,
    CategoriesModule,
    NovitaModule,
    GenerationModule,
    WebhooksModule,
    HealthModule,
  ],
})
export class AppModule {}
