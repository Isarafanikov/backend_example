import { applyDecorators } from '@nestjs/common';
import { Type } from '@nestjs/passport';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { FindAllDto } from '../dto/find-all.dto';

// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/explicit-function-return-type
export const ApiPaginatedDto = <TModel extends Type>(model: TModel) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(FindAllDto) },
          {
            properties: {
              content: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};
