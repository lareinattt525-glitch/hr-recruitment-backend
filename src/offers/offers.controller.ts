import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferConfirmCallbackDto } from './dto/offer-confirm-callback.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

// Offer涉及薪资，整个控制器限制为HR（webhook回调单独标 @Public 覆盖）
@Roles(UserRole.HR)
@Controller()
export class OffersController {
  constructor(private readonly service: OffersService) {}

  @Post('offers')
  create(@Body() dto: CreateOfferDto) {
    return this.service.create(dto);
  }

  @Get('offers/:id/confirmation-status')
  confirmationStatus(@Param('id') id: string) {
    return this.service.getConfirmationStatus(id);
  }

  @Get('resumes/:resumeId/offer')
  findByResume(@Param('resumeId') resumeId: string) {
    return this.service.findByResume(resumeId);
  }

  // 飞书群消息卡片回调：HR/业务leader/COO 任意一方点击"确认"，来自飞书服务器，签名校验代替登录
  // TODO: 同 interviews 模块，接入真实飞书应用后补上 verifySignature 校验
  @Public()
  @Post('webhooks/feishu/offer-confirm-callback')
  confirmCallback(@Body() dto: OfferConfirmCallbackDto) {
    return this.service.handleConfirmCallback(dto.offerId, dto.confirmerId);
  }

  @Post('offers/:id/generate-email')
  generateEmail(@Param('id') id: string) {
    return this.service.generateEmail(id);
  }

  @Post('offers/:id/send')
  send(@Param('id') id: string) {
    return this.service.send(id);
  }
}
