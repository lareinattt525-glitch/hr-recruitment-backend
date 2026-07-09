import { Module } from '@nestjs/common';
import { AiAdapterService } from './ai-adapter.service';
import { DeepSeekProvider } from './deepseek.provider';

@Module({
  providers: [AiAdapterService, DeepSeekProvider],
  exports: [AiAdapterService],
})
export class AiAdapterModule {}
