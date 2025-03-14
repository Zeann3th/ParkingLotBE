import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import env from './config';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as morgan from 'morgan';
import * as compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const setMiddleware = (app: NestExpressApplication) => {
  app.use(compression());

  app.use(helmet());

  app.enableCors({
    origin: "*",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })

  app.use(morgan("combined"));

}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new Logger("[]"),
  });

  const logger = new Logger("APP");
  app.useLogger(logger);

  app.setGlobalPrefix("v1");

  setMiddleware(app);

  if (env.NODE_ENV !== "prod") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Parking Lot")
      .setDescription('API documentation for Parking Lot Backend')
      .setVersion('alpha')
      .addBearerAuth()
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('swagger', app, swaggerDocument, {
      jsonDocumentUrl: 'swagger/json',
    });
  }


  await app.listen(env.PORT, () => {
    logger.log("🚀 Parking Lot BE 0.1.0");
  });
}

bootstrap();
