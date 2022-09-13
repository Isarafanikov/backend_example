import { applyDecorators } from '@nestjs/common';
import { Type } from '@nestjs/passport';
import { ApiQuery } from '@nestjs/swagger';
import { MetadataHandler } from '../metadata-handler';
import { FilteringMetadata, KEY_FILTER } from '../prisma-filtering';
import { plainToInstance } from 'class-transformer';

// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/explicit-function-return-type
export const ApiFindAllQuery = <T, U>(filterDto: Type<T>, sortDto: Type<U>) => {
  const params: MethodDecorator[] = [];
  params.push(
    ApiQuery({
      name: '_skip',
      required: false,
      description: 'Amount of elements to skip. If specified, `_page` parameter will be ignored',
      schema: {
        type: 'integer',
        minimum: 0,
      },
    }),
    ApiQuery({
      name: '_limit',
      required: false,
      description: 'Amount of elements to take, or amount of items per page',
      schema: {
        type: 'integer',
        minimum: 1,
      },
    }),
    ApiQuery({
      name: '_page',
      required: false,
      description: 'Current page. If `_skip` is specified, this parameter is ignored',
      schema: {
        type: 'integer',
        minimum: 1,
      },
    }),
  );
  const instance = plainToInstance(filterDto, {});
  const filterFields = MetadataHandler.getMatchingFields<T, FilteringMetadata>(
    instance,
    KEY_FILTER,
  );
  const fields = Object.getOwnPropertyNames(filterFields);
  for (const field of fields) {
    const schema = filterFields[field as keyof T].getSchema();
    params.push(
      ApiQuery({
        required: false,
        name: field,
        description: schema.description,
        style: 'deepObject',
        schema: schema,
      }),
    );
  }
  const sortFields = Object.getOwnPropertyNames(plainToInstance(sortDto, {}));
  params.push(
    ApiQuery({
      name: '_sort',
      required: false,
      description:
        'Fields to sort by. Allowed values: ' + sortFields.map((e) => `\`${e}\``).join(', '),
      schema: {
        type: 'array',
        items: {
          type: 'string',
          pattern: '^(' + sortFields.join('|') + ')$',
          example: sortFields[0],
        },
      },
    }),
  );
  params.push(
    ApiQuery({
      name: '_order',
      required: false,
      description:
        'Array of sorting orders of fields specified in `_sort`. Each value must be' +
        'either `asc` or `desc`',
      schema: {
        type: 'array',
        items: {
          type: 'string',
          pattern: '^(asc|desc)$',
          example: 'asc',
        },
      },
    }),
  );
  return applyDecorators(...params);
};
