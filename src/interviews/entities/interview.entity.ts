import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { InterviewRoundType, InterviewStatus, InterviewResult } from '../../common/enums';

@Entity('interviews')
export class Interview {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() candidateId: string;
  @Column() positionId: string;
  @Column() resumeId: string;

  @Column({ type: 'enum', enum: InterviewRoundType }) roundType: InterviewRoundType;
  @Column({ nullable: true }) interviewerId: string;

  @Column({ type: 'enum', enum: InterviewStatus, default: InterviewStatus.PENDING }) status: InterviewStatus;
  @Column({ type: 'timestamptz', nullable: true }) scheduledTime: Date;
  @Column({ type: 'text', nullable: true }) feedback: string;
  @Column({ type: 'enum', enum: InterviewResult, nullable: true }) result: InterviewResult;

  @CreateDateColumn() createdAt: Date;
}
