import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../../common/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ unique: true }) email: string;
  @Column() name: string;
  @Column() passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.DEPT }) role: UserRole;

  // 预留字段：后续接入"飞书扫码登录"时，用飞书 open_id 关联账号，可与密码登录并存
  @Column({ nullable: true }) feishuOpenId: string;

  @CreateDateColumn() createdAt: Date;
}
