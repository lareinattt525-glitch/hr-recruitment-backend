import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ConfirmerRole } from '../../common/enums';
import { Offer } from './offer.entity';

// HR / 业务leader / COO 三方确认记录，全部confirmed=true后 offer.status 才流转为 confirmed
@Entity('offer_confirmations')
export class OfferConfirmation {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => Offer, (o) => o.confirmations) @JoinColumn({ name: 'offerId' }) offer: Offer;
  @Column() offerId: string;

  @Column() confirmerId: string; // 飞书 open_id
  @Column({ type: 'enum', enum: ConfirmerRole }) confirmerRole: ConfirmerRole;
  @Column({ default: false }) confirmed: boolean;
  @Column({ type: 'timestamptz', nullable: true }) confirmedAt: Date;
}
