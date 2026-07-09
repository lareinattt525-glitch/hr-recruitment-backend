import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from './entities/candidate.entity';

@Injectable()
export class CandidatesService {
  constructor(@InjectRepository(Candidate) private readonly repo: Repository<Candidate>) {}

  findOrCreateByEmail(data: { name: string; email?: string; phone?: string; source?: Candidate['source'] }) {
    // 简历邮箱轮询服务据此创建/复用候选人记录
    return this.repo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(Candidate);
      let candidate = data.email ? await repo.findOneBy({ email: data.email }) : null;
      if (!candidate) candidate = await repo.save(repo.create(data));
      return candidate;
    });
  }

  async findOne(id: string): Promise<Candidate> {
    const candidate = await this.repo.findOneBy({ id });
    if (!candidate) throw new NotFoundException(`候选人 ${id} 不存在`);
    return candidate;
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }
}
