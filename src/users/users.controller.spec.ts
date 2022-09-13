import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { plainToInstance } from 'class-transformer';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { PrismaError } from 'prisma-error-enum';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config';
import { mockConfig } from '../../test/test-utils';
import { PaginationDto, PaginationInputDto } from '../base-entity/dto/pagination.dto';
import { FindAllDto } from '../base-entity/dto/find-all.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let prisma: DeepMockProxy<PrismaService>;

  const userPassword = '12345678';
  const hash = bcrypt.hashSync(userPassword, 10);

  const mockUser = (id: number): User => {
    return {
      id: id,
      username: `test${id}`,
      displayName: `test${id}_display`,
      passwordHash: hash,
      admin: false,
      lastTokenReset: new Date(0),
    };
  };
  const mockCreateDto = (id: number): CreateUserDto => {
    return {
      username: `test${id}`,
      displayName: `test${id}_display`,
      password: userPassword,
    };
  };
  const mockUpdateDto = (id: number): UpdateUserDto => {
    return {
      username: `test${id}`,
      displayName: `test${id}_display`,
    };
  };

  const authUser = plainToInstance(User, mockUser(1));
  const adminUser = plainToInstance(User, mockUser(1));
  adminUser.admin = true;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        ConfigService,
        UsersService,
        { provide: ConfigService, useFactory: () => mockDeep<ConfigService>() },
        { provide: PrismaService, useFactory: () => mockDeep<PrismaService>() },
      ],
    }).compile();

    const config = module.get<ConfigService<Config>>(ConfigService) as unknown as DeepMockProxy<
      ConfigService<Config>
    >;
    mockConfig(config);

    prisma = module.get<PrismaService>(PrismaService) as unknown as DeepMockProxy<PrismaService>;
    controller = module.get<UsersController>(UsersController);
  });

  it('Should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Creation

  it('Should create user', async () => {
    prisma.user.create.mockResolvedValueOnce(mockUser(2));

    await expect(controller.create(mockCreateDto(2), authUser)).resolves.toEqual(
      plainToInstance(User, mockUser(2)),
    );
  });

  it('Should throw ConflictException on creation conflict', async () => {
    prisma.user.create.mockRejectedValueOnce(
      new PrismaClientKnownRequestError('', PrismaError.UniqueConstraintViolation, '', {
        target: ['username'],
      }),
    );

    await expect(controller.create(mockCreateDto(2), authUser)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  // Finding
  it('Should return only current user', async () => {
    prisma.user.findMany.mockResolvedValueOnce([mockUser(1)]);
    prisma.user.count.mockResolvedValueOnce(1);

    await expect(
      controller.findAll(plainToInstance(PaginationInputDto, {}), {}, [], authUser),
    ).resolves.toEqual(
      new FindAllDto(
        plainToInstance(User, [mockUser(1)]),
        new PaginationDto(new PaginationInputDto(), 1),
        {},
        [],
      ),
    );

    expect(prisma.user.count).toHaveBeenCalledWith({
      where: {
        id: authUser.id,
      },
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        id: authUser.id,
      },
      skip: 0,
      take: 1,
      orderBy: [],
    });
  });

  it('Should return all users as admin', async () => {
    prisma.user.findMany.mockResolvedValueOnce([]);
    prisma.user.count.mockResolvedValueOnce(0);

    await expect(controller.findAll(new PaginationInputDto(), {}, [], adminUser)).resolves.toEqual(
      new FindAllDto(
        plainToInstance(User, []),
        new PaginationDto(new PaginationInputDto(), 0),
        {},
        [],
      ),
    );
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 0,
      orderBy: [],
    });
  });

  it('Should return one user', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(mockUser(1));

    await expect(controller.findOne(1, authUser)).resolves.toEqual(
      plainToInstance(User, mockUser(1)),
    );
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });
  });

  it('Should return other user as admin', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(mockUser(2));

    await expect(controller.findOne(2, adminUser)).resolves.toEqual(
      plainToInstance(User, mockUser(2)),
    );
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        id: 2,
      },
    });
  });

  it('Should throw ForbiddenException when accessing other user', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(mockUser(2));

    await expect(controller.findOne(2, authUser)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Should throw NotFoundException on missing user search', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(controller.findOne(5, adminUser)).rejects.toBeInstanceOf(NotFoundException);
  });

  // Updating

  it('Should update user', async () => {
    prisma.user.update.mockResolvedValueOnce(mockUser(1));

    await expect(controller.update(1, mockUpdateDto(1), authUser)).resolves.toEqual(
      plainToInstance(User, mockUser(1)),
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: mockUpdateDto(1),
    });
  });

  it('Should update user as admin', async () => {
    prisma.user.update.mockResolvedValueOnce(mockUser(2));

    await expect(controller.update(2, mockUpdateDto(2), adminUser)).resolves.toEqual(
      plainToInstance(User, mockUser(2)),
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: {
        id: 2,
      },
      data: mockUpdateDto(2),
    });
  });

  it('Should throw ForbiddenException when updating other user', async () => {
    prisma.user.update.mockResolvedValueOnce(mockUser(2));

    await expect(controller.update(2, mockUpdateDto(2), authUser)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(prisma.user.update).toBeCalledTimes(0);
  });

  it('Should throw ConflictException on update conflict', async () => {
    prisma.user.update.mockRejectedValueOnce(
      new PrismaClientKnownRequestError('', PrismaError.UniqueConstraintViolation, '', {
        target: ['username'],
      }),
    );

    await expect(controller.update(1, mockUpdateDto(1), authUser)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('Should throw NotFoundException on missing user update', async () => {
    prisma.user.update.mockRejectedValueOnce(
      new PrismaClientKnownRequestError('', PrismaError.RecordsNotFound, '', {}),
    );

    await expect(controller.update(5, mockUpdateDto(1), adminUser)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // Deletion

  it('Should return deleted user', async () => {
    prisma.user.delete.mockResolvedValueOnce(mockUser(1));

    await expect(controller.remove(1, authUser)).resolves.toEqual(
      plainToInstance(User, mockUser(1)),
    );
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });
  });

  it('Should return other deleted user as admin', async () => {
    prisma.user.delete.mockResolvedValueOnce(mockUser(2));

    await expect(controller.remove(2, adminUser)).resolves.toEqual(
      plainToInstance(User, mockUser(2)),
    );
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: {
        id: 2,
      },
    });
  });

  it('Should throw ForbiddenException when deleting other user', async () => {
    prisma.user.delete.mockResolvedValueOnce(mockUser(2));

    await expect(controller.remove(2, authUser)).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.user.delete).toBeCalledTimes(0);
  });

  it('Should throw NotFoundException on missing user deletion', async () => {
    prisma.user.delete.mockRejectedValueOnce(
      new PrismaClientKnownRequestError('', PrismaError.RecordsNotFound, '', {}),
    );

    await expect(controller.remove(5, adminUser)).rejects.toBeInstanceOf(NotFoundException);
  });

  // SetAdmin
  it('Should set user as admin', async () => {
    await expect(
      controller.setAdmin(
        2,
        {
          password: userPassword,
          admin: true,
        },
        adminUser,
      ),
    ).resolves.not.toThrow();

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: {
        id: 2,
      },
      data: {
        admin: true,
      },
    });
  });

  // eslint-disable-next-line max-len
  it('Should throw ForbiddenException when trying to set user as admin while logged as non-admin', async () => {
    await expect(
      controller.setAdmin(
        2,
        {
          password: userPassword,
          admin: true,
        },
        authUser,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.user.update).toBeCalledTimes(0);
  });

  // eslint-disable-next-line max-len
  it('Should throw ForbiddenException when trying to set user as admin with incorrect password', async () => {
    await expect(
      controller.setAdmin(
        2,
        {
          password: 'incorrect',
          admin: true,
        },
        adminUser,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.user.update).toBeCalledTimes(0);
  });
});
