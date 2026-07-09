import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { JdStatus, PositionStatus } from '../../common/enums';
import { Resume } from '../../resumes/entities/resume.entity';
import { ScoringCriteria } from '../../scoring/entities/scoring-criteria.entity';

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() title: string;
  @Column() department: string;
  @Column({ default: 1 }) headcount: number;
  @Column({ type: 'int', nullable: true }) salaryMin: number;
  @Column({ type: 'int', nullable: true }) salaryMax: number;

  // 用人部门/HR填写的原始需求，与AI产出的JD分开存储，便于追溯
  @Column({ type: 'text' }) requirementsRaw: string;
  @Column({ type: 'text', nullable: true }) jdGenerated: string;

  @Column({ type: 'enum', enum: JdStatus, default: JdStatus.DRAFT }) jdStatus: JdStatus;
  @Column({ type: 'enum', enum: PositionStatus, default: PositionStatus.OPEN }) status: PositionStatus;

  @Column({ nullable: true }) requesterId: string;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;

  @OneToMany(() => Resume, (r) => r.position) resumes: Resume[];
  @OneToMany(() => ScoringCriteria, (sc) => sc.position) scoringCriteria: ScoringCriteria[];
}
