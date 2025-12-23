import { Controller, Get, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AccessTokenGuard } from '../common/guards/access-token.guard';

@UseGuards(AccessTokenGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly-summary')
  async getMonthlySummary(@Req() req: any, @Query('month') month: string) {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new BadRequestException('Month is required in YYYY-MM format');
    }
    const userId = req.user['sub'];
    return this.reportsService.getMonthlySummary(userId, month);
  }
}
