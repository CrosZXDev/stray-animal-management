import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { HealthController } from './health.controller';
import { GlobalExceptionFilter } from './shared/filters/http-exception.filter';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { AnimalModule } from './modules/animal/animal.module';
import { ReportModule } from './modules/report/report.module';
import { HealthModule } from './modules/health/health.module';
import { AdoptionModule } from './modules/adoption/adoption.module';
import { CommunityModule } from './modules/community/community.module';
import { MapModule } from './modules/map/map.module';
import { LineWebhookModule } from './modules/line-webhook/line-webhook.module';
import { NotificationModule } from './shared/services/notification.module';
import { CacheModule } from './shared/services/cache.module';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { ImageService } from './shared/services/image.service';
import { ImageController } from './shared/services/image.controller';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    CacheModule,
    NotificationModule,
    AuthModule,
    AnimalModule,
    ReportModule,
    HealthModule,
    AdoptionModule,
    CommunityModule,
    MapModule,
    LineWebhookModule,
  ],
  controllers: [HealthController, ImageController],
  providers: [
    ImageService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
