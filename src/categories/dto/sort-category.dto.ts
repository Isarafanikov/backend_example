import { Prisma } from '@prisma/client';
import { FilterCategoryDto } from './filter-category.dto';
import { Expose } from 'class-transformer';

export class SortCategoryDto
  implements Partial<Pick<Prisma.CategoryOrderByWithRelationInput, keyof FilterCategoryDto>>
{
  @Expose()
  id?: Prisma.SortOrder;
  @Expose()
  label?: Prisma.SortOrder;
  @Expose()
  userId?: Prisma.SortOrder;
}
