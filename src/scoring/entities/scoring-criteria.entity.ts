import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CriteriaSource } from '../../common/enums';
import { Position } from '../../positions/entities/position.entity';

// 版本化的评分标准；每次"优化"生成新版本而不是覆盖，可回滚
@Entity('scoring_criteria')
export class ScoringCriteria {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => Position, (p) => p.scoringCriteria, { nullable: true })
  @JoinColumn({ name: 'positionId' })
  position: Position;

  @Column({ nullable: true }) positionId: string;
  @Column() version: number;

  // 维度 -> 权重，例如 { "技能匹配度": 0.3, "经验匹配度": 0.25, ... }
  @Column({ type: 'jsonb' }) dimensions: Record<string, number>;
  @Column({ type: 'text' }) promptTemplate: string;

  @Column({ type: 'enum', enum: CriteriaSource, default: CriteriaSource.SYSTEM }) createdBy: CriteriaSource;
  @Column({ default: false }) isActive: boolean;

  @CreateDateColumn() createdAt: Date;
}
