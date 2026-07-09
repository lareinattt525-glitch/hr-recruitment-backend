import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  async create(dto: CreateUserDto) {
    const existing = await this.repo.findOneBy({ email: dto.email });
    if (existing) throw new ConflictException('该邮箱已注册过账号');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.repo.create({ email: dto.email, name: dto.name, passwordHash, role: dto.role });
    const saved = await this.repo.save(user);
    const { passwordHash: _omit, ...safe } = saved;
    return safe;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ email });
  }

  async findById(id: string): Promise<User> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('账号不存在');
    return user;
  }

  count(): Promise<number> {
    return this.repo.count();
  }

  async findAll() {
    const users = await this.repo.find({ order: { createdAt: 'DESC' } });
    // 明确剔除密码哈希，永远不通过接口把它返回出去
    return users.map(({ passwordHash, ...rest }) => rest);
  }
}
