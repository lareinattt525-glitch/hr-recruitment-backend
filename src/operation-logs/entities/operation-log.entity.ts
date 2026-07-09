import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// 全流程审计日志：谁在什么时候对什么实体做了什么操作
@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() entityType: string;
  @Column() entityId: string;
  @Column({ nullable: true }) operatorId: string;
  @Column() action: string;
  @Column({ type: 'jsonb', nullable: true }) before: Record<string, any>;
  @Column({ type: 'jsonb', nullable: true }) after: Record<string, any>;

  @CreateDateColumn() createdAt: Date;
}
