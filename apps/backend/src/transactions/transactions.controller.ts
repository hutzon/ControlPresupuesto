import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, ValidationPipe } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto, FindTransactionsDto } from './dto/transaction.dto';
import { AccessTokenGuard } from '../common/guards/access-token.guard';

@UseGuards(AccessTokenGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Req() req: any, @Body() createTransactionDto: CreateTransactionDto) {
    const userId = req.user['sub'];
    return this.transactionsService.create(userId, createTransactionDto);
  }

  @Get()
  findAll(@Req() req: any, @Query(new ValidationPipe({ transform: true })) query: FindTransactionsDto) {
    const userId = req.user['sub'];
    return this.transactionsService.findAll(userId, query);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user['sub'];
    return this.transactionsService.findOne(id, userId);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    const userId = req.user['sub'];
    return this.transactionsService.update(id, userId, updateTransactionDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user['sub'];
    return this.transactionsService.remove(id, userId);
  }
}
