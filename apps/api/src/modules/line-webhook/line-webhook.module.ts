import { Module } from '@nestjs/common';
import { LineWebhookController } from './line-webhook.controller';
import { LineWebhookService } from './line-webhook.service';
import { ReportModule } from '../report/report.module';
import { LineService } from '../../shared/services/line.service';

@Module({
  imports: [ReportModule],
  controllers: [LineWebhookController],
  providers: [LineWebhookService, LineService],
})
export class LineWebhookModule {}
