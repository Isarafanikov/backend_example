import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { PrismaFiltering } from '../prisma-filtering';
import { Type } from '@nestjs/common/interfaces/type.interface';

@Injectable()
export class FilteringPipe<T extends object, WhereType>
  implements PipeTransform<string, WhereType>
{
  _constructor: Type<T>;

  constructor(constructor: Type<T>) {
    this._constructor = constructor;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: string, metadata: ArgumentMetadata): WhereType {
    return PrismaFiltering.generateWhereObjectFromQuery<T, WhereType>(this._constructor, value);
  }
}
