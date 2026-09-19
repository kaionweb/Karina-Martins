import "dotenv/config";
import cookieParser from "cookie-parser";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { buildCorsOptions } from "./common/config/cors.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.enableCors(buildCorsOptions());

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}

bootstrap();
