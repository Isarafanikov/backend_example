import {
  baseBoolFields,
  baseFilterFields,
  baseStringFields,
  enumerableBoolFields,
  enumerableFilterFields,
  PrismaFiltering,
} from './prisma-filtering';
import { Filterable } from './decorators/filterable.decorator';

class TestClass {
  @Filterable('integer')
  intField!: unknown;

  @Filterable('string')
  stringField!: unknown;

  @Filterable('date')
  dateField!: unknown;

  @Filterable('float')
  floatField!: unknown;

  @Filterable('boolean')
  booleanField!: unknown;
}

describe('PrismaFiltering', () => {
  function generateQuery<T>(
    key: keyof TestClass,
    value: T,
    baseFields: readonly string[],
    listFields: readonly string[],
    additionalPath: string[] = [],
  ): string {
    const fullPath = key + additionalPath.map((e) => `[${e}]`).join('');
    const encoded = value;
    return [
      ...baseFields.map((e) => `${fullPath}[${e}]=${encoded}`),
      ...listFields.map((e) => `${fullPath}[${e}]=${encoded},${encoded},${encoded}`),
    ].join('&');
  }

  function expectedWhereQuery<T>(
    key: keyof TestClass,
    value: T,
    baseFields: readonly string[],
    listFields: readonly string[],
    additionalPath: string[] = [],
  ): unknown {
    let obj: Record<string, unknown> = {};
    for (const key of baseFields) {
      obj[key] = value;
    }
    for (const key of listFields) {
      obj[key] = [value, value, value];
    }
    for (const key of additionalPath) {
      obj = { [key]: obj };
    }
    return {
      [key]: obj,
    };
  }

  function defaultTests(
    description: string,
    fieldName: keyof TestClass,
    validValues: Record<string, [unknown, unknown]>,
    invalidValues: Record<string, unknown>,
    baseFields: readonly string[],
    listFields: readonly string[],
  ): void {
    describe(description, () => {
      // Testing valid values
      for (const key of Object.getOwnPropertyNames(validValues)) {
        describe(`with ${key} values`, () => {
          const [rawQueryValue, expectedValue] = validValues[key];
          const queryValue = encodeURIComponent(String(rawQueryValue));

          it('should parse default fields', () => {
            const query = generateQuery(fieldName, queryValue, baseFields, listFields);
            expect(PrismaFiltering.generateWhereObjectFromQuery(TestClass, query)).toEqual(
              expectedWhereQuery(fieldName, expectedValue, baseFields, listFields),
            );
          });

          it('should parse root value', () => {
            expect(
              PrismaFiltering.generateWhereObjectFromQuery(TestClass, `${fieldName}=${queryValue}`),
            ).toEqual({
              [fieldName]: expectedValue,
            });
          });

          it("should parse default fields in 'not' field", () => {
            const notQuery = generateQuery(fieldName, queryValue, baseFields, listFields, ['not']);
            expect(PrismaFiltering.generateWhereObjectFromQuery(TestClass, notQuery)).toEqual(
              expectedWhereQuery(fieldName, expectedValue, baseFields, listFields, ['not']),
            );
          });

          it("should parse root value in 'not' field", () => {
            expect(
              PrismaFiltering.generateWhereObjectFromQuery(
                TestClass,
                `${fieldName}[not]=${queryValue}`,
              ),
            ).toEqual({
              [fieldName]: { not: expectedValue },
            });
          });
        });
      }

      // Testing invalid values
      for (const key of Object.getOwnPropertyNames(invalidValues)) {
        it(`Should throw BadRequestException for ${key} value`, () => {
          expect(() =>
            PrismaFiltering.generateWhereObjectFromQuery(
              TestClass,
              `${fieldName}=${invalidValues[key]}`,
            ),
          ).toThrow();
        });
      }
    });
  }

  defaultTests(
    'Integer filters',
    'intField',
    { integer: [3, 3] },
    { decimal: 3.5, 'non-numerical': 'string', array: '3,4,5' },
    baseFilterFields,
    enumerableFilterFields,
  );

  defaultTests(
    'Float filters',
    'floatField',
    { decimal: [3, 3], integer: [3, 3] },
    { 'non-numerical': 'string', array: '3,4,5' },
    baseFilterFields,
    enumerableFilterFields,
  );

  defaultTests(
    'Date filters',
    'dateField',
    {
      date: ['2015-06-18', new Date('2015-06-18')],
      'full date': [new Date('2015-06-18'), new Date('2015-06-18')],
    },
    { 'invalid date': 'invalid' },
    baseFilterFields,
    enumerableFilterFields,
  );

  defaultTests(
    'String filters',
    'stringField',
    { string: ['testString', 'testString'] },
    { array: 'test,test,test' },
    baseStringFields,
    enumerableFilterFields,
  );

  defaultTests(
    'Boolean filters',
    'booleanField',
    { true: [true, true], false: [false, false] },
    { 'non-boolean string': 'string' },
    baseBoolFields,
    enumerableBoolFields,
  );
});
