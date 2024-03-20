import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import session from "express-session";
import passport from "passport";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import PostgreSQLStore from "connect-pg-simple";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
  const pgSessionStore = PostgreSQLStore(session);
  app.use(
    session({
      store: new pgSessionStore({
        conString: configService.get("DATABASE_URL"),
        createTableIfMissing: true
      }),
      secret: configService.get("SESSION_SECRET"),
      resave: false,
      saveUninitialized: false,
      cookie: {
        sameSite: "lax",
        httpOnly: true
      }
    })
  );

  // Static assets
  app.useStaticAssets(join(__dirname, "..", "static"));

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
