import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Transaction } from '../entities/transaction.entity';
import { IsDate, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto extends OmitType(Transaction, [
  'id',
  'userId',
  'date',
  'categoryId',
] as const) {
  /**
   * Id of transaction user
   * @default Id of the authenticated user will be used
   */
  @IsInt()
  @IsOptional()
  public userId?: number;

  /**
   * Transaction date
   */
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @ApiPropertyOptional()
  date?: Date;

  /**
   * Id of transaction category
   */
  @IsInt()
  @IsOptional()
  @ApiPropertyOptional()
  categoryId?: number;
}
