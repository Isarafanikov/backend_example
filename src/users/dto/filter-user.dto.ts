import { Prisma } from '@prisma/client';
import { Filterable } from '../../base-entity/decorators/filterable.decorator';
import { Expose } from 'class-transformer';

export class FilterUserDto implements Prisma.UserWhereInput {
  @Filterable('integer')
  @Expose()
  id?: number | Prisma.IntFilter;

  @Filterable('string')
  @Expose()
  username?: string | Prisma.StringFilter;

  @Filterable('string')
  @Expose()
  displayName?: string | Prisma.StringFilter;

  @Filterable('boolean')
  @Expose()
  admin?: boolean | Prisma.BoolFilter;
}
