import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';
import { OfferConfirmation } from './entities/offer-confirmation.entity';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { CandidatesModule } from '../candidates/candidates.module';
import { PositionsModule } from '../positions/positions.module';
import { AiAdapterModule } from '../ai-adapter/ai-adapter.module';
import { FeishuModule } from '../feishu-integration/feishu.module';

@Module({
  imports: [TypeOrmModule.forFeature([Offer, OfferConfirmation]), CandidatesModule, PositionsModule, AiAdapterModule, FeishuModule],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
