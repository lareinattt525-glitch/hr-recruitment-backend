import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// 飞书卡片回调写入：业务面试官是否同意面试 + 可选时间段
@Entity('interviewer_responses')
export class InterviewerResponse {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() interviewId: string;
  @Column() interviewerId: string;
  @Column() willingToInterview: boolean;
  @Column({ type: 'jsonb', nullable: true }) availableSlots: string[];

  @CreateDateColumn() respondedAt: Date;
}
