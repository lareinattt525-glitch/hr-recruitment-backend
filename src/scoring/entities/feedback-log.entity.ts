import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// HR对AI评分准确性的反馈 —— 评分标准优化的原始数据来源
@Entity('feedback_logs')
export class FeedbackLog {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() scoreRecordId: string;
  @Column() hrUserId: string;
  @Column() isAccurate: boolean;
  @Column({ nullable: true }) correctJudgement: string;
  @Column({ type: 'text', nullable: true }) feedbackReason: string;

  @CreateDateColumn() createdAt: Date;
}
