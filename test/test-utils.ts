import { DeepMockProxy } from 'jest-mock-extended';
import { ConfigService } from '@nestjs/config';
import { Config } from '../src/config';

export function mockConfig(proxy: DeepMockProxy<ConfigService<Config>>): void {
  proxy.get.mockImplementation((key: string) => {
    const value = {
      JWT_ACCESS_TOKEN_EXPIRATION_TIME: '15m',
      JWT_ACCESS_TOKEN_SECRET: 'secret',

      JWT_REFRESH_TOKEN_EXPIRATION_TIME: '1w',
      JWT_REFRESH_TOKEN_SECRET: 'secret_refresh',
      PASSWORD_SALT_ROUNDS: 10,
    }[key];
    if (value === undefined) throw new Error(`Config key ${key} is not mocked!`);
    return value;
  });
}
