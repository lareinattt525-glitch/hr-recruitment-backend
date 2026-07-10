import { Module } from '@nestjs/common';
import { FeishuWebhookController } from './feishu-webhook.controller';
import { FeishuModule } from '../feishu-integration/feishu.module';
import { InterviewsModule } from '../interviews/interviews.module';
import { OffersModule } from '../offers/offers.module';

@Module({
  imports: [FeishuModule, InterviewsModule, OffersModule],
  controllers: [FeishuWebhookController],
})
export class FeishuWebhookModule {}
