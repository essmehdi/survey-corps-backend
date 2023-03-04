import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import * as session from "express-session";
import * as passport from "passport";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS Headers
  app.enableCors({
    credentials: true,
    origin: true
  });

  // Validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );

  // .env & Environment variables module init
  const configService = app.get(ConfigService);

  // Cookie sessions
  app.use(
    session({
      secret: configService.get("SESSION_SECRET"),
      resave: false,
      saveUninitialized: false,
      cookie: {
        sameSite: "lax",
        httpOnly: true
      }
    })
  );

  // Passport init
  app.use(passport.initialize());
  app.use(passport.session());

  // Swagger init
  const swaggerConfig = new DocumentBuilder()
    .setTitle("ENSIAS Bridge Survey API")
    .setDescription("The main API of ENSIAS Bridge Survey project")
    .setVersion("1.0")
    .addCookieAuth("connect.sid")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api", app, document);

  // App init
  await app.listen(process.env.PORT || 8080);
}
bootstrap();
