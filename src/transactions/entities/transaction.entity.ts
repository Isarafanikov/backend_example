import { IsDate, IsInt, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class Transaction {
  @IsInt()
  id: number;
  /**
   * Transaction label
   */
  @IsString()
  label: string;

  /**
   * Transaction date
   */
  @IsDate()
  @Type(() => Date)
  date: Date;

  /**
   * Transaction amount. Negative value is a loss, while positive is an income
   */
  @IsNumber()
  amount: number;

  /**
   * Id of transaction category
   */
  @IsInt()
  categoryId: number;

  /**
   * Id of transaction user
   */
  @IsInt()
  userId: number;

  constructor(
    id: number,
    label: string,
    date: Date,
    amount: number,
    categoryId: number,
    userId: number,
  ) {
    this.id = id;
    this.label = label;
    this.date = date;
    this.amount = amount;
    this.categoryId = categoryId;
    this.userId = userId;
  }
}
