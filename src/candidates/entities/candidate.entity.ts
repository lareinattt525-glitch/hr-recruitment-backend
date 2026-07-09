import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CandidateSource } from '../../common/enums';
import { Resume } from '../../resumes/entities/resume.entity';

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() name: string;
  @Column({ nullable: true }) phone: string;
  @Column({ nullable: true }) email: string;

  @Column({ type: 'enum', enum: CandidateSource, default: CandidateSource.EMAIL }) source: CandidateSource;

  @Column({ nullable: true }) currentCompany: string;
  @Column({ nullable: true }) currentTitle: string;

  @CreateDateColumn() createdAt: Date;

  @OneToMany(() => Resume, (r) => r.candidate) resumes: Resume[];
}
