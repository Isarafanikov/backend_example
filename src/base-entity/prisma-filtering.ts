import { Prisma } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { MetadataHandler } from './metadata-handler';
import { Type } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import * as qs from 'qs';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export const KEY_FILTER = Symbol('filtering');

export const baseFilterFields = ['equals', 'lt', 'lte', 'gt', 'gte'] as const;
export const enumerableFilterFields = ['in', 'notIn'] as const;

export const baseBoolFields = ['equals'] as const;
export const enumerableBoolFields = [] as const;
export const baseStringFields = [
  ...baseFilterFields,
  'contains',
  'startsWith',
  'endsWith',
] as const;

type AllOf<Keys extends keyof any, Value> = {
  [P in Keys]: Value;
};

export type Filter<
  BaseFields extends readonly string[],
  EnumerableFields extends readonly string[],
  T,
> = Partial<AllOf<BaseFields[number], T>> &
  Partial<AllOf<EnumerableFields[number], Prisma.Enumerable<T>>> & {
    not?: Omit<Filter<BaseFields, EnumerableFields, T>, 'not'> | T;
  };

export class PrismaFiltering {
  /**
   * Map of available field filtering types matched to their parsing functions
   * @private
   */
  private static parsers: { [P in FilteringMetadata['type']]: (obj: any, key: string) => unknown } =
    {
      integer: (obj, key) =>
        PrismaFiltering.baseFilter<number>(obj[key], PrismaFiltering.parseInteger, key),
      float: (obj, key) =>
        PrismaFiltering.baseFilter<number>(obj[key], PrismaFiltering.parseFloat, key),
      date: (obj, key) => PrismaFiltering.baseFilter(obj[key], PrismaFiltering.parseDate, key),
      boolean: (obj, key) =>
        PrismaFiltering.baseFilter(
          obj[key],
          PrismaFiltering.parseBool,
          key,
          baseBoolFields,
          enumerableBoolFields,
        ),
      string: (obj, key) =>
        PrismaFiltering.baseFilter(obj[key], PrismaFiltering.parseString, key, baseStringFields),
    };

  /**
   * Generates Prisma where query based on provided query object
   * @param whereDto - where query DTO
   * @return Prisma where query
   */
  public static generateWhereObject<
    T extends object,
    WhereInput extends {
      OR?: Prisma.Enumerable<WhereInput>;
      AND?: Prisma.Enumerable<WhereInput>;
      NOT?: Prisma.Enumerable<WhereInput>;
    },
  >(whereDto: T): WhereInput {
    const metadata = MetadataHandler.getMatchingFields<T, FilteringMetadata>(whereDto, KEY_FILTER);
    const result: Record<string, unknown> = {};

    for (const key of Object.getOwnPropertyNames(whereDto)) {
      if (!metadata.hasOwnProperty(key)) continue;
      const fieldMetadata = metadata[key as keyof T];
      result[key] = PrismaFiltering.parsers[fieldMetadata.type](whereDto, key);
    }

    return result as WhereInput;
  }

  public static generateWhereObjectFromQuery<
    T extends object,
    WhereInput extends {
      OR?: Prisma.Enumerable<WhereInput>;
      AND?: Prisma.Enumerable<WhereInput>;
      NOT?: Prisma.Enumerable<WhereInput>;
    },
  >(constructor: Type<T>, query: string): WhereInput {
    return PrismaFiltering.generateWhereObject(
      plainToInstance(constructor, qs.parse(query, { comma: true })),
    );
  }

  public static readonly description: string = (
    'Following fields are applicable for most filters:\n' +
    '+ `equals`: Exact match. Using this filter is the same as using plain value without ' +
    'specifying any filter. Example: `?id[equals]=4` is the same as `?id=4`\n' +
    '+ `lt`: "Less than" - Only result less than the provided criteria will be returned\n' +
    '+ `lte`: "Less than or equal" - Only result less than, or equal to the provided criteria ' +
    'will be returned\n' +
    '+ `gt`: "Greater than" - Only result greater than the provided criteria will be returned\n' +
    '+ `gte`: "Greater than or equal" -  Only result greater than, or equal to the provided ' +
    'criteria will be returned\n' +
    '+ `in`: Only results within the specified array will be returned\n' +
    '+ `notin`: Inverse of `in`\n' +
    '+ `not`: nested filter, can have any other filters specified withing it, and inverts their ' +
    'effect. Example: `?id[not][gte]=5&id[not][lte]=10` will return all values except those with ' +
    'ids from 5 to 10. If only `equals` filter is used inside `not`, plain value can be used' +
    ' instead. Example: `?id[not][equals]=4` can be simplified to `?id[not]=4`\n' +
    'String fields have additional filters\n' +
    '+ `contains`: only strings that contain filter value will be returned\n' +
    '+ `startsWith`: only strings that start with filter value will be returned\n' +
    '+ `endsWith`: only strings that end with filter value will be returned\n' +
    'Boolean fields only have `equals` and `not` filters'
  ).replace(/\n/g, '\n\n');

  public static parseInteger(obj: unknown, path: string): number {
    const parsed = Number(obj);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException(`${obj} is not a valid number. At: ${path}.`);
    }
    if (Math.trunc(parsed) !== parsed) {
      throw new BadRequestException('Got decimal number where integer was expected. At: ' + path);
    }
    return parsed;
  }

  private static parseFloat(obj: unknown, path: string): number {
    const parsed = Number(obj);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException(`${obj} is not a valid number. At: ${path}.`);
    }
    return parsed;
  }

  private static parseBool(obj: unknown, path: string): boolean {
    if (obj === 'true') return true;
    if (obj === 'false') return false;
    throw new BadRequestException(`Booleans string was expected at ${path}. Got: ${obj}`);
  }

  private static parseString(obj: unknown, path: string): string {
    if (typeof obj === 'string') return obj;
    throw new BadRequestException(`String was expected at ${path}. Got: ${obj}`);
  }

  private static parseDate(obj: unknown, path: string): Date {
    if (typeof obj !== 'string') {
      throw new BadRequestException(`Date string was expected at ${path}. Got: ${obj}`);
    }
    const date = new Date(obj);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid date string at ${path}`);
    }
    return date;
  }

  /**
   * Parsed provided {@link obj} into valid filter
   * @param obj - object to parse
   * @param parse - value parsing function
   * @param path - current parsing path
   * @param baseFields - plain fields included into filter
   * @param enumerableFields - enumerable (array) fields included into filter
   * @param allowNot - controls if recursive `not` options is parsed
   * @private
   */
  private static baseFilter<
    T,
    BaseFields extends readonly string[] = typeof baseFilterFields,
    EnumerableFields extends readonly string[] = typeof enumerableFilterFields,
  >(
    obj: unknown,
    parse: (value: unknown, path: string) => T,
    path: string,
    baseFields?: BaseFields,
    enumerableFields?: EnumerableFields,
    allowNot = true,
  ): Filter<BaseFields, EnumerableFields, T> | T | undefined {
    baseFields ??= baseFilterFields as unknown as BaseFields;
    enumerableFields ??= enumerableFilterFields as unknown as EnumerableFields;
    if (obj === undefined) return undefined;
    if (typeof obj == 'string') {
      return parse(obj, path);
    }
    if (!PrismaFiltering.isRecord(obj)) {
      throw new BadRequestException(`Object was expected at ${path}. Got: ${obj}`);
    }
    const result = {} as Filter<BaseFields, EnumerableFields, T>;

    // Plain fields are parsed as-is
    for (const key of baseFields) {
      if (obj.hasOwnProperty(key)) {
        (result as { [P in typeof key]: T })[key] = parse(obj[key], path + `.${key}`);
      }
    }

    // Enumerable fields are parsed as array
    for (const key of enumerableFields) {
      if (!obj.hasOwnProperty(key)) {
        continue;
      }
      const source = obj[key];
      // noinspection SuspiciousTypeOfGuard
      if (typeof source === 'string') {
        (result as { [P in typeof key]: T })[key] = parse(source, path);
      } else {
        if (!Array.isArray(source)) {
          throw new BadRequestException(`Array was expected at ${path}.${key}. Got: ${source}`);
        }
        const elements = new Array<T>(source.length);
        for (let i = 0; i < source.length; i++) {
          const element = source[i];
          elements[i] = parse(element, path + `.${key}[${i}]`);
        }
        (result as { [P in typeof key]: T[] })[key] = elements;
      }
    }

    // single recursive call for `not` function
    if (obj.hasOwnProperty('not')) {
      if (allowNot) {
        const notObj = obj['not'];
        result['not'] = PrismaFiltering.baseFilter(
          notObj,
          parse,
          path + '.not',
          baseFields,
          enumerableFields,
          false,
        );
      } else {
        throw new BadRequestException(`Nested "not" filter is not allowed. At: ${path}.not`);
      }
    }

    for (const key of Object.getOwnPropertyNames(obj)) {
      if (!result.hasOwnProperty(key)) {
        throw new BadRequestException(`Unknown property "${key}" found in ${path}`);
      }
    }

    return result;
  }

  /**
   * Type guard to check if {@link obj} is a record type
   * Actually just checks that {@link obj} is a plain js object
   * @param obj - object to check
   * @private
   * @return true is {@link obj} is {@link Record}
   */
  private static isRecord(obj: unknown): obj is Record<string, unknown> {
    return typeof obj === 'object' && !Array.isArray(obj) && obj != null;
  }
}

export class FilteringMetadata {
  type: 'string' | 'integer' | 'date' | 'boolean' | 'float';

  constructor(type: FilteringMetadata['type']) {
    this.type = type;
  }

  public getSchema(): SchemaObject {
    const fields =
      this.type === 'string'
        ? baseStringFields
        : this.type === 'boolean'
        ? baseBoolFields
        : baseFilterFields;
    const enumFields = this.type === 'boolean' ? enumerableBoolFields : enumerableFilterFields;
    const schema: SchemaObject = {
      type: 'object',
      required: [],
      example: '',
      properties: {},
      description: `${
        this.type
      } filter. Can either be plain value, or object with following properties: ${[
        ...fields,
        ...enumFields,
      ]
        .map((e) => `\`${e}\``)
        .join(', ')}`,
    };
    const type = this.type === 'date' ? 'string' : this.type;
    const format = this.type === 'date' ? 'date-time' : undefined;
    const props: Record<string, SchemaObject> = {};
    for (const field of fields) {
      props[field] = {
        type: type,
        format: format,
      };
    }
    for (const field of fields) {
      props[field] = {
        type: 'array',
        items: {
          type: type,
          format: format,
        },
      };
    }
    props['not'] = {
      type: 'object',
    };
    schema.properties = props;

    return schema;
  }
}
