import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { User } from './entities/user.entity';
import { BaseEntityService } from '../base-entity/base-entity.service';
import { User as PrismaUser } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SetAdminDto } from './dto/set-admin.dto';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config';
import { FilterUserDto } from './dto/filter-user.dto';
import { SortUserDto } from './dto/sort-user.dto';
import { PaginationDto } from '../base-entity/dto/pagination.dto';

@Injectable()
export class UsersService extends BaseEntityService<
  User,
  PrismaUser,
  CreateUserDto,
  UpdateUserDto,
  FilterUserDto,
  SortUserDto
> {
  constructor(private prisma: PrismaService, private config: ConfigService<Config, true>) {
    super(User);
  }

  /**
   * Returns one {@link User} with matching {@link username}
   * @param username - username of the required user
   * @return {User}
   * @throws {NotFoundException} if entity couldn't be found
   */
  public async findOneByUsername(username: string): Promise<User> {
    const user = await this.runAndConvert(() =>
      this.prisma.user.findUnique({
        where: {
          username: username,
        },
      }),
    );
    if (user === null) throw new NotFoundException();
    return user;
  }

  /**
   * Validates password
   * @param password - password to validate
   * @return error string if password is invalid, or null if password is valid
   */
  public validatePassword(password: string): string | null {
    //todo add config options
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    return null;
  }

  public async changePassword(user: User, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(
      newPassword,
      this.config.get<number>('PASSWORD_SALT_ROUNDS'),
    );
    this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash: passwordHash,
        lastTokenReset: new Date(),
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async _create(createDto: CreateUserDto, authUser?: User): Promise<PrismaUser> {
    const passwordError = this.validatePassword(createDto.password);
    if (passwordError != null) {
      throw new BadRequestException(passwordError);
    }
    const passwordHash = await bcrypt.hash(
      createDto.password,
      this.config.get<number>('PASSWORD_SALT_ROUNDS'),
    );
    const usersCount = await this.prisma.user.count();
    return await this.prisma.user.create({
      data: {
        username: createDto.username,
        displayName: createDto.displayName,
        passwordHash: passwordHash,
        lastTokenReset: new Date(),
        //First created user is always an admin
        admin: usersCount == 0,
      },
    });
  }

  protected _countAll(authUser?: User, filter?: FilterUserDto): Promise<number> {
    const where = { ...filter };
    if (authUser !== undefined && !authUser.admin) {
      where.id = authUser.id;
    }
    return this.prisma.user.count({
      where: where,
    });
  }

  protected async _findAll(
    pagination: PaginationDto,
    filter?: FilterUserDto,
    sort?: SortUserDto[],
    authUser?: User,
  ): Promise<PrismaUser[]> {
    const where = { ...filter };

    if (authUser !== undefined && !authUser.admin) {
      where.id = authUser.id;
    }
    return await this.prisma.user.findMany({
      where: where,
      orderBy: sort,
      skip: pagination.skip,
      take: pagination.limit,
    });
  }

  protected _findOne(id: number, authUser?: User): Promise<PrismaUser | null> {
    UsersService.checkIdPermissions(id, authUser);
    return this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });
  }

  protected _update(id: number, updateDto: UpdateUserDto, authUser?: User): Promise<PrismaUser> {
    UsersService.checkIdPermissions(id, authUser);
    return this.prisma.user.update({
      where: {
        id: id,
      },
      data: updateDto,
    });
  }

  protected _remove(id: number, authUser?: User): Promise<PrismaUser> {
    UsersService.checkIdPermissions(id, authUser);
    return this.prisma.user.delete({
      where: {
        id: id,
      },
    });
  }

  /**
   * Validates {@link authUser} with password provided in {@link SetAdminDto.password} and then
   * changes admin state of that user to match {@link SetAdminDto.admin}.
   * @param id - id of manipulated user
   * @param adminDto - password and admin state DTO
   * @param authUser - authorized user
   * @throws {ForbiddenException} if authorized user is not admin
   * @throws {UnauthorizedException} if password is incorrect
   */
  public async validateAndSetAdmin(
    id: number,
    adminDto: SetAdminDto,
    authUser: User,
  ): Promise<void> {
    if (!authUser.admin) {
      throw new ForbiddenException('Only admin users can manipulate admin permissions');
    }
    if (await bcrypt.compare(adminDto.password, authUser.passwordHash)) {
      if (!adminDto.admin) {
        if (
          (await this.prisma.user.count({
            where: {
              admin: true,
            },
          })) === 1
        ) {
          throw new ForbiddenException("The last admin in the system can't delete itself");
        }
      }
      return this.setAdmin(id, adminDto.admin);
    } else {
      throw new UnauthorizedException('Invalid password');
    }
  }

  public async setAdmin(id: number, admin: boolean): Promise<void> {
    await this.prisma.user.update({
      where: {
        id: id,
      },
      data: {
        admin: admin,
      },
    });
  }

  private static checkIdPermissions(id: number, authUser?: User): void {
    if (authUser !== undefined && !authUser.admin && authUser.id != id)
      throw new ForbiddenException("Non-admins can't access data of other users");
  }
}
