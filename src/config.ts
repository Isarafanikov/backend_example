export interface Config {
  JWT_ACCESS_TOKEN_EXPIRATION_TIME: string;
  JWT_ACCESS_TOKEN_SECRET: string;

  JWT_REFRESH_TOKEN_EXPIRATION_TIME: string;
  JWT_REFRESH_TOKEN_SECRET: string;

  PORT?: string;
  DEFAULT_CATEGORY_NAME?: string;

  PASSWORD_SALT_ROUNDS: number;
}