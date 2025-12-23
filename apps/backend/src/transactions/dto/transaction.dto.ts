import { IsNotEmpty, IsNumber, IsString, IsEnum, IsDateString, IsOptional, MaxLength, Min, IsUUID, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateTransactionDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  note?: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @IsUUID()
  @IsOptional()
  categoryId?: string;
}

export class UpdateTransactionDto extends CreateTransactionDto {}

export class FindTransactionsDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Month must be in YYYY-MM format' })
  month: string;

  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  pageSize?: number = 100;
}
