import { IsBoolean, IsString } from 'class-validator';

export class SetAdminDto {
  /**
   * Target admin state of edited account
   */
  @IsBoolean()
  public admin: boolean;

  /**
   * Password of current account. Used for validation purposes
   */
  @IsString()
  public password: string;

  constructor(admin: boolean, password: string) {
    this.admin = admin;
    this.password = password;
  }
}
