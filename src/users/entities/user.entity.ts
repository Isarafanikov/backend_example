import { User as PrismaUser } from '@prisma/client';
import { IsBoolean, IsDate, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude, Transform, Type } from 'class-transformer';

export class User implements PrismaUser {
  @IsInt()
  public id: number;

  /**
   * Unique name of the user
   */
  @IsString()
  @Transform((value) => value.value.toLowerCase())
  public username: string;

  /**
   * Display name of the user
   */
  @IsString()
  public displayName: string;

  @ApiHideProperty()
  @IsOptional()
  @IsString()
  @Exclude({
    toPlainOnly: true,
  })
  public passwordHash = '';

  /**
   * Admin permissions
   */
  @IsBoolean()
  public admin: boolean;

  @ApiHideProperty()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @Exclude({
    toPlainOnly: true,
  })
  public lastTokenReset: Date = new Date(0);

  constructor(
    id: number,
    username: string,
    displayName: string,
    passwordHash: string,
    admin: boolean,
    lastTokenReset: Date,
  ) {
    this.id = id;
    this.username = username;
    this.displayName = displayName;
    this.passwordHash = passwordHash;
    this.admin = admin;
    this.lastTokenReset = lastTokenReset;
  }
}
