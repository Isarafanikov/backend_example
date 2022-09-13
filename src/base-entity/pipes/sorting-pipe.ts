import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { PrismaSorting } from '../prisma-sorting';

@Injectable()
export class SortingPipe<OrderBy extends object>
  implements PipeTransform<string, Partial<OrderBy>[]>
{
  _constructor: Type<OrderBy>;

  constructor(constructor: Type<OrderBy>) {
    this._constructor = constructor;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: string, metadata: ArgumentMetadata): Partial<OrderBy>[] {
    return PrismaSorting.generateOrderByArrayFromQuery<OrderBy>(this._constructor, value);
  }
}
