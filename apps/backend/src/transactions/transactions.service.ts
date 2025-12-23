import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto, FindTransactionsDto } from './dto/transaction.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    if (createTransactionDto.categoryId) {
       // Validate category ownership
       const category = await this.prisma.category.findUnique({
         where: { id: createTransactionDto.categoryId },
       });
       if (!category || category.userId !== userId) {
         throw new NotFoundException('Category not found');
       }
    }

    return this.prisma.transaction.create({
      data: {
        ...createTransactionDto,
        userId,
      },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
  }

  async findAll(userId: string, query: FindTransactionsDto) {
    const { month, type, categoryId, q, page = 1, pageSize = 100 } = query;
    const skip = (page - 1) * pageSize;

    // Timezone: UTC. Month YYYY-MM. 
    // Start: YYYY-MM-01T00:00:00.000Z
    // End: YYYY-MM+1-01T00:00:00.000Z (Exclusive)
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const nextMonth = new Date(startDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const endDate = nextMonth;

    const where: Prisma.TransactionWhereInput = {
      userId,
      date: {
        gte: startDate,
        lt: endDate,
      },
      ...(type && { type }),
      ...(categoryId && { categoryId }),
      ...(q && { note: { contains: q, mode: 'insensitive' } }),
    };

    const [total, data] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        take: pageSize,
        skip,
        orderBy: { date: 'desc' },
        include: { category: { select: { id: true, name: true, icon: true, color: true } } },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        lastPage: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async update(id: string, userId: string, updateTransactionDto: UpdateTransactionDto) {
    await this.findOne(id, userId);
    
    // Check Cat ownership if updating it
    if (updateTransactionDto.categoryId) {
       const category = await this.prisma.category.findUnique({
         where: { id: updateTransactionDto.categoryId },
       });
       if (!category || category.userId !== userId) {
         throw new NotFoundException('Category not found');
       }
    }

    return this.prisma.transaction.update({
      where: { id },
      data: updateTransactionDto,
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.transaction.delete({
      where: { id },
    });
  }
}
