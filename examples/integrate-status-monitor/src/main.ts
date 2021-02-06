import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';

const logger = new Logger('bootstrap');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const PORT = +process.env.PORT || 3001;
  await app.listen(PORT);
  logger.log(`Access status monitor at http://localhost:${PORT}/status`);
}
bootstrap();
