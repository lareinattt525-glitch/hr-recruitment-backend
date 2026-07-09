import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdateJdDto } from './dto/update-jd.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('positions')
export class PositionsController {
  constructor(private readonly service: PositionsService) {}

  // HR或用人部门都可以提交职位需求
  @Roles(UserRole.HR, UserRole.DEPT)
  @Post()
  create(@Body() dto: CreatePositionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(UserRole.HR)
  @Post(':id/generate-jd')
  generateJD(@Param('id') id: string) {
    return this.service.generateJD(id);
  }

  @Roles(UserRole.HR)
  @Put(':id/jd')
  updateJD(@Param('id') id: string, @Body() dto: UpdateJdDto) {
    return this.service.updateJD(id, dto);
  }
}
