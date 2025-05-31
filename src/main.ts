import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import * as dotenv from "dotenv";
import { seedData } from './modules/analytics/seed-data';
import { Connection } from 'typeorm';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // removes unexpected properties
      forbidNonWhitelisted: true, // throw error if unexpected properties
      transform: true, // auto-transform payloads to DTO instances
    })
  );

  // Seed data for load testing
  const connection = app.get(Connection);
  await seedData(connection);

  await app.listen(3000);
  console.log("🚀 Application is running on: http://localhost:3000");
}
bootstrap();
