import { Prisma } from '@prisma/client';
import { Filterable } from '../../base-entity/decorators/filterable.decorator';
import { Expose } from 'class-transformer';

export class FilterCategoryDto implements Prisma.CategoryWhereInput {
  @Filterable('integer')
  @Expose()
  id?: number | Prisma.IntFilter;

  @Filterable('string')
  @Expose()
  label?: string | Prisma.StringFilter;

  @Filterable('integer')
  @Expose()
  userId?: number | Prisma.IntFilter;
}
