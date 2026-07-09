/**
 * 一次性脚本：创建第一个管理员账号。
 * 用法： npm run create-admin -- --email=you@company.com --password=xxxxxxxx --name="你的名字"
 *
 * 之所以单独用脚本而不是开放公开注册接口，是因为这是内部HR系统，不应该有人能通过网页
 * 自己注册出一个管理员账号。第一个管理员建好后，后续账号都通过管理员登录后调用
 * POST /users 创建（见 users 模块）。
 */
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

import dataSource from '../config/typeorm.config';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums';

function parseArgs() {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

async function main() {
  const { email, password, name } = parseArgs();
  if (!email || !password || !name) {
    console.error('用法: npm run create-admin -- --email=you@company.com --password=xxxxxxxx --name="你的名字"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('密码至少需要8位');
    process.exit(1);
  }

  await dataSource.initialize();
  const repo = dataSource.getRepository(User);

  const existing = await repo.findOneBy({ email });
  if (existing) {
    console.error(`邮箱 ${email} 已经注册过账号了，不能重复创建`);
    await dataSource.destroy();
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = repo.create({ email, name, passwordHash, role: UserRole.ADMIN });
  await repo.save(user);

  console.log(`管理员账号创建成功：${email}`);
  console.log('现在可以用这个邮箱和密码调用 POST /auth/login 登录了。');
  await dataSource.destroy();
}

main().catch((err) => {
  console.error('创建失败：', err);
  process.exit(1);
});
