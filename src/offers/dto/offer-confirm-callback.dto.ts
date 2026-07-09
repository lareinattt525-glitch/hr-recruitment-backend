import { IsString } from 'class-validator';

export class OfferConfirmCallbackDto {
  @IsString() offerId: string;
  @IsString() confirmerId: string;
}
