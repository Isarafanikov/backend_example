import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { PaginationInputDto } from '../dto/pagination.dto';
import { PrismaPagination } from '../prisma-pagination';

@Injectable()
export class PaginationPipe implements PipeTransform<string, PaginationInputDto> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: string, metadata: ArgumentMetadata): PaginationInputDto {
    return PrismaPagination.parseQuery(value);
  }
}
