import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, static as serveStatic } from 'express';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const maxBodySize = config.get<number>('app.maxBodySize', 20 << 20);
  const uploadDir = config.get<string>('app.uploadDir', `${process.cwd()}/uploads`);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID'],
  });
  app.use(json({ limit: `${maxBodySize}b` }));
  mkdirSync(uploadDir, { recursive: true });
  app.use('/uploads', serveStatic(uploadDir));
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Face Swap API')
    .setDescription('Backend for the iOS Face Swap app. Upload generation media with multipart/form-data.')
    .setVersion('1.0.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    jsonDocumentUrl: '/openapi.json',
    yamlDocumentUrl: '/openapi.yaml',
    customSiteTitle: 'Face Swap API Docs',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: false,
      forbidUnknownValues: false,
    }),
  );

  const port = config.get<number>('app.port', 8080);
  await app.listen(port);
  Logger.log(`listening on :${port}`);
}

void bootstrap();
