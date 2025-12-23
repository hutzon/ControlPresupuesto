import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getMonthlySummary(userId: string, month: string) {
    // Dates UTC
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const nextMonth = new Date(startDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const endDate = nextMonth;

    const where: Prisma.TransactionWhereInput = {
      userId,
      date: { gte: startDate, lt: endDate },
    };

    // 1. Aggregates (Income, Expense)
    const aggregates = await this.prisma.transaction.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
    });

    let incomeTotal = 0;
    let expenseTotal = 0;

    aggregates.forEach(agg => {
      const amount = Number(agg._sum.amount); // Decimal to Number for JSON.
      if (agg.type === 'INCOME') incomeTotal = amount;
      if (agg.type === 'EXPENSE') expenseTotal = amount;
    });

    const net = incomeTotal - expenseTotal;

    // 2. By Category (Expense Only usually?) Let's do all.
    const byCategoryRaw = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { ...where, type: 'EXPENSE' }, // Breakdown usually for expenses
      _sum: { amount: true },
    });

    // We need category names
    const categoryIds = byCategoryRaw.map(c => c.categoryId).filter(id => id !== null) as string[];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true, icon: true },
    });
    
    const byCategory = byCategoryRaw.map(item => {
      const cat = categories.find(c => c.id === item.categoryId);
      const amount = Number(item._sum.amount);
      return {
        categoryId: item.categoryId ?? 'uncategorized',
        categoryName: cat ? cat.name : 'Sin Categoría',
        color: cat?.color ?? '#cccccc',
        icon: cat?.icon ?? '?',
        total: amount,
        percent: expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0
      };
    }).sort((a, b) => b.total - a.total);

    // 3. Daily Trend
    // Raw query might be better for "date_trunc day", but groupBy is safer with Prisma
    // We group by date? Date includes time, so group by time is wrong.
    // Prisma doesn't support Date_Trunc easily in groupBy yet without raw.
    // Let's use raw query for daily or just fetch all and reduce in JS (if < 1000 txs per month, it's fine).
    // MVP: fetch all lightweight.
    const allTxs = await this.prisma.transaction.findMany({
      where,
      select: { date: true, amount: true, type: true },
    });
    
    const dailyMap = new Map<string, { income: number; expense: number }>();
    
    allTxs.forEach(tx => {
       const day = tx.date.toISOString().split('T')[0];
       if (!dailyMap.has(day)) dailyMap.set(day, { income: 0, expense: 0 });
       const entry = dailyMap.get(day);
       const val = Number(tx.amount);
       if (tx.type === 'INCOME') entry!.income += val;
       else entry!.expense += val;
    });

    const daily = Array.from(dailyMap.entries())
      .map(([date, val]) => ({ date, ...val }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 4. Top Expenses
    const topExpenses = await this.prisma.transaction.findMany({
      where: { ...where, type: 'EXPENSE' },
      orderBy: { amount: 'desc' },
      take: 5,
      include: { category: { select: { name: true } } },
    });

    const mappedTop = topExpenses.map(tx => ({
       id: tx.id,
       amount: Number(tx.amount),
       date: tx.date,
       note: tx.note,
       categoryName: tx.category?.name ?? 'Sin Categoría',
    }));

    return {
      month,
      incomeTotal,
      expenseTotal,
      net,
      byCategory,
      daily,
      topExpenses: mappedTop,
      insights: [] // TODO: Add logic
    };
  }
}
