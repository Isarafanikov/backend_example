import { PaginationInputDto } from './dto/pagination.dto';
import * as qs from 'qs';
import { ParsedQs } from 'qs';
import { PrismaFiltering } from './prisma-filtering';

export class PrismaPagination {
  public static parseQuery(query: string): PaginationInputDto {
    const plain = qs.parse(query);
    const paginated = new PaginationInputDto();
    if (plain.hasOwnProperty('_limit')) {
      paginated.limit = PrismaPagination.parseInteger(plain, '_limit');
    }

    if (plain.hasOwnProperty('_skip')) {
      paginated.skip = PrismaPagination.parseInteger(plain, '_skip');
      paginated.limit ||= 10;
    } else if (plain.hasOwnProperty('_page')) {
      paginated.page = PrismaPagination.parseInteger(plain, '_page');
      paginated.limit ||= 10;
    }
    return paginated;
  }

  private static parseInteger(obj: ParsedQs, key: string): number {
    return PrismaFiltering.parseInteger(obj[key], key);
  }
}
