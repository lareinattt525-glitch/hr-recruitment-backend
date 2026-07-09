import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('interview_question_suggestions')
export class InterviewQuestionSuggestion {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() interviewId: string;
  @Column({ type: 'jsonb' }) questions: { category: string; questions: string[] }[];

  @CreateDateColumn() generatedAt: Date;
}
