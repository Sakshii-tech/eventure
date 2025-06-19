import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }
  });
  
  app.useGlobalPipes(new ValidationPipe());
  // Serve uploads directory with /uploads prefix
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });
  
  // Serve static files from root directory
  app.useStaticAssets(join(__dirname, '..'), {
    index: false, // Disable serving index.html as the default file
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
