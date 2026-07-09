import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OfferStatus } from '../../common/enums';
import { OfferConfirmation } from './offer-confirmation.entity';

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() candidateId: string;
  @Column() positionId: string;
  @Column() resumeId: string;

  @Column({ nullable: true }) salaryFinal: string;
  @Column({ type: 'text', nullable: true }) negotiationNotes: string;

  @Column({ type: 'enum', enum: OfferStatus, default: OfferStatus.DRAFT }) status: OfferStatus;
  @Column({ type: 'text', nullable: true }) emailDraft: string;
  @Column({ type: 'timestamptz', nullable: true }) emailSentAt: Date;

  @CreateDateColumn() createdAt: Date;

  @OneToMany(() => OfferConfirmation, (oc) => oc.offer) confirmations: OfferConfirmation[];
}
