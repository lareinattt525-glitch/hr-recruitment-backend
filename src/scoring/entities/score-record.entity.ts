import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('score_records')
export class ScoreRecord {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() resumeId: string;
  @Column() criteriaVersionId: string;

  @Column({ type: 'int' }) score: number;
  @Column({ type: 'jsonb' }) dimensionScores: Record<string, number>;
  @Column({ type: 'text' }) aiReasoning: string;
  @Column({ default: false }) recommendInterview: boolean;

  @CreateDateColumn() createdAt: Date;
}
