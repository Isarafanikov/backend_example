import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Config } from './config';
import * as cors from 'cors';
import { PrismaFiltering } from './base-entity/prisma-filtering';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(cors());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        exposeDefaultValues: true,
      },
    }),
  );

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Expense backend')
    .setDescription('Expense app backend API\n\n' + PrismaFiltering.description)
    .setVersion('0.0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService) as ConfigService<Config>;
  const port = configService.get<string>('PORT', '3000');

  await app.listen(port);
}

bootstrap();
