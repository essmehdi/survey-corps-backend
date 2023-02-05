import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import * as session from "express-session";
import * as passport from "passport";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    credentials: true,
    origin: true
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );

  const configService = app.get(ConfigService);

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

  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(process.env.PORT || 8080);
}
bootstrap();
