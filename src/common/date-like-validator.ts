import {
  registerDecorator,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ValidationOptions } from 'joi';

@ValidatorConstraint({ name: 'dateLike', async: false })
export class IsDateLikeConstraint implements ValidatorConstraintInterface {
  defaultMessage(validationArguments?: ValidationArguments): string {
    const value = validationArguments?.value;
    console.log(value);
    if (value === undefined || value === null) return 'Value must not be null';
    if (typeof value !== 'number' && typeof value !== 'string') {
      return 'Value must be either valid date string or a number';
    }
    return `String ${value} is not a valid date`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(value: unknown, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
    if (typeof value !== 'number' && typeof value !== 'string') return false;
    try {
      new Date(value);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export function IsDateLike(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDateLikeConstraint,
    });
  };
}
