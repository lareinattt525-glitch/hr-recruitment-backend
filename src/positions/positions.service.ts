import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from './entities/position.entity';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdateJdDto } from './dto/update-jd.dto';
import { JdStatus } from '../common/enums';
import { AiAdapterService } from '../ai-adapter/ai-adapter.service';

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(Position) private readonly repo: Repository<Position>,
    private readonly aiAdapter: AiAdapterService,
  ) {}

  create(dto: CreatePositionDto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Position> {
    const position = await this.repo.findOneBy({ id });
    if (!position) throw new NotFoundException(`职位 ${id} 不存在`);
    return position;
  }

  /** 触发AI生成JD草稿（不改变发布状态，需HR再调用 updateJD 确认发布） */
  async generateJD(id: string) {
    const position = await this.findOne(id);
    const jd = await this.aiAdapter.generateJD(position);
    position.jdGenerated = jd;
    return this.repo.save(position);
  }

  /** HR编辑确认后发布JD */
  async updateJD(id: string, dto: UpdateJdDto) {
    const position = await this.findOne(id);
    position.jdGenerated = dto.jdGenerated;
    position.jdStatus = JdStatus.PUBLISHED;
    return this.repo.save(position);
  }
}
