import { Prisma } from '@prisma/client';
import { FilterTransactionDto } from './filter-transaction.dto';
import { Expose } from 'class-transformer';

export class SortTransactionDto
  implements Partial<Pick<Prisma.TransactionOrderByWithRelationInput, keyof FilterTransactionDto>>
{
  @Expose()
  id?: Prisma.SortOrder;
  @Expose()
  label?: Prisma.SortOrder;
  @Expose()
  date?: Prisma.SortOrder;
  @Expose()
  amount?: Prisma.SortOrder;
  @Expose()
  categoryId?: Prisma.SortOrder;
  @Expose()
  userId?: Prisma.SortOrder;
}
