import { Prisma } from '@prisma/client';
import { Type } from '@nestjs/passport';
import * as qs from 'qs';
import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

export class PrismaSorting {
  static generateOrderByArray<OrderBy extends object>(
    sortObject: OrderBy,
    keys: unknown[],
    order: unknown[],
    defaultOrder: Prisma.SortOrder = 'asc',
  ): Partial<OrderBy>[] {
    const orderBy: unknown[] = [];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const sortOrder = order[i] ?? defaultOrder;
      if (typeof key !== 'string' || !sortObject.hasOwnProperty(key)) {
        throw new BadRequestException(`${key} is not a valid sorting field`);
      }
      if (sortOrder !== 'asc' && sortOrder !== 'desc') {
        throw new BadRequestException(`${sortOrder} is not a valid sorting order.`);
      }
      orderBy.push({
        [key]: order[i] ?? defaultOrder,
      });
    }
    return orderBy as Partial<OrderBy>[];
  }

  static generateOrderByArrayFromQuery<OrderBy extends object>(
    constructor: Type<OrderBy>,
    query: string,
  ): Partial<OrderBy>[] {
    const parsed = qs.parse(query, { comma: true });
    let sort = parsed['_sort'];
    let order = parsed['_order'];
    if (sort === undefined && order === undefined) return [];
    if (typeof sort === 'string') sort = [sort];
    if (typeof order === 'string') order = [order];
    if (!Array.isArray(sort)) throw new BadRequestException('_sort must be a string array');
    if (!Array.isArray(order)) throw new BadRequestException('_order must be a string array');
    return PrismaSorting.generateOrderByArray(plainToInstance(constructor, {}), sort, order);
  }
}
