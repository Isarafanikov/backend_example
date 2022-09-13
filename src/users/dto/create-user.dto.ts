import { User } from '../entities/user.entity';
import { OmitType } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateUserDto extends OmitType(User, [
  'id',
  'passwordHash',
  'lastTokenReset',
  'admin',
] as const) {
  /**
   * Password of this user
   */
  @IsString()
  public password: string;

  constructor(username: string, displayName: string, password: string) {
    super();
    this.username = username;
    this.displayName = displayName;
    this.password = password;
  }
}
