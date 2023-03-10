import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersService } from "./users/users.service";
import { UsersModule } from "./users/users.module";
import { FormModule } from "./form/form.module";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "@nestjs/config";
import { ApplicationModule } from "./application/application.module";
import { PrismaService } from "./prisma/prisma.service";
import { TokensModule } from "./tokens/tokens.module";
import { MailModule } from "./mail/mail.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    FormModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "static")
    }),
    ApplicationModule,
    TokensModule,
    MailModule
  ],
  controllers: [AppController],
  providers: [AppService, UsersService]
})
export class AppModule {}
