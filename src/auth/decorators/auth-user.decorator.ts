import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

export const AuthUser = createParamDecorator(
  (isRequired: boolean | undefined, ctx: ExecutionContext) => {
    isRequired ??= true;
    const request = ctx.switchToHttp().getRequest() as unknown as { user?: unknown };
    if (!(request.user instanceof User) && isRequired)
      throw new Error(`${request.user} is not an instance of User`);
    //request.headers.authorization
    return request.user;
  },
);
