import { Prisma } from '@prisma/client';
import { Filterable } from '../../base-entity/decorators/filterable.decorator';
import { Expose } from 'class-transformer';

export class FilterTransactionDto implements Prisma.TransactionWhereInput {
  @Filterable('integer')
  @Expose()
  id?: number | Prisma.IntFilter;

  @Filterable('string')
  @Expose()
  label?: string | Prisma.StringFilter;

  @Filterable('date')
  @Expose()
  date?: string | Prisma.DateTimeFilter | Date;

  @Filterable('float')
  @Expose()
  amount?: number | Prisma.FloatFilter;

  @Filterable('integer')
  @Expose()
  categoryId?: number | Prisma.IntNullableFilter | null;

  @Filterable('integer')
  @Expose()
  userId?: number | Prisma.IntFilter;
}
