import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CandidateStage } from '../../common/enums';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Position } from '../../positions/entities/position.entity';

// Resume 代表"某候选人对某职位的一次应聘"，pipeline阶段挂在这里
@Entity('resumes')
export class Resume {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => Candidate, (c) => c.resumes) @JoinColumn({ name: 'candidateId' }) candidate: Candidate;
  @Column() candidateId: string;

  @ManyToOne(() => Position, (p) => p.resumes, { nullable: true }) @JoinColumn({ name: 'positionId' }) position: Position;
  @Column({ nullable: true }) positionId: string;

  @Column({ nullable: true }) fileUrl: string;
  @Column({ nullable: true }) rawEmailId: string;

  // AI"非结构化→结构化"解析后的内容（教育经历/工作经历/技能等）
  @Column({ type: 'jsonb', nullable: true }) parsedContent: Record<string, any>;
  // 简历原始文本，评分/问题建议等场景直接使用
  @Column({ type: 'text', nullable: true }) rawText: string;

  @Column({ type: 'enum', enum: CandidateStage, default: CandidateStage.NEW }) stage: CandidateStage;
  @Column({ nullable: true }) rejectedReason: string;

  @CreateDateColumn() receivedAt: Date;
}
