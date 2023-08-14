import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersService } from "./users/users.service";
import { UsersModule } from "./users/users.module";
import { FormModule } from "./form/form.module";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ApplicationModule } from "./application/application.module";
import { PrismaService } from "./prisma/prisma.service";
import { TokensModule } from "./tokens/tokens.module";
import { MailModule } from "./mail/mail.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { NotifierModule } from "./notifier/notifier.module";
import { StatsModule } from "./stats/stats.module";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { UnsuccessfulInterceptor } from "./utils/interceptors/UnsuccessfulInterceptor";

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    FormModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ApplicationModule,
    TokensModule,
    MailModule,
    NotifierModule,
    StatsModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        ttl: config.get("THROTTLE_TTL"),
        limit: config.get("THROTTLE_LIMIT")
      })
    })
  ],
  controllers: [AppController],
  providers: [
    AppService,
    UsersService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: UnsuccessfulInterceptor
    }
  ]
})
export class AppModule {}
