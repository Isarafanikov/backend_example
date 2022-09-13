import { Prisma } from '@prisma/client';
import { FilterUserDto } from './filter-user.dto';
import { Expose } from 'class-transformer';

export class SortUserDto
  implements Partial<Pick<Prisma.UserOrderByWithRelationInput, keyof FilterUserDto>>
{
  @Expose()
  id?: Prisma.SortOrder;
  @Expose()
  username?: Prisma.SortOrder;
  @Expose()
  displayName?: Prisma.SortOrder;
  @Expose()
  admin?: Prisma.SortOrder;
}
