import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CategoriesController } from '../categories/categories.controller';
import { PrismaService } from '../prisma/prisma.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users/users.controller';
import { UsersService } from '../users/users.service';
import { CategoriesService } from '../categories/categories.service';
import { plainToInstance } from 'class-transformer';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config';
import { mockConfig } from '../../test/test-utils';
import { PaginationDto, PaginationInputDto } from '../base-entity/dto/pagination.dto';
import { FindAllDto } from '../base-entity/dto/find-all.dto';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let prisma: DeepMockProxy<PrismaService>;
  const authUser = new User(1, 'user1', 'user1_display', '', false, new Date());
  const adminUser = new User(1, 'user1', 'user1_display', '', true, new Date());

  const mockCategory = (id: number, userId: number): Category => {
    return {
      id: id,
      label: `label_${id}`,
      userId: userId,
    };
  };

  const mockTransaction = (id: number, userId: number, categoryId: number): Transaction => {
    return {
      id: id,
      categoryId: categoryId,
      userId: userId,
      label: `label_${id}`,
      date: new Date(1000),
      amount: 1000,
    };
  };

  const mockCreateDto = (
    id: number,
    userId: number | undefined,
    categoryId: number,
  ): CreateTransactionDto => {
    return {
      categoryId: categoryId,
      userId: userId,
      label: `label_${id}`,
      date: new Date(1000),
      amount: 1000,
    };
  };
  const mockUpdateDto = (id: number, categoryId?: number): UpdateTransactionDto => {
    return {
      categoryId: categoryId,
      label: `label_${id}`,
      date: new Date(1000),
      amount: 1000,
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController, CategoriesController, TransactionsController],
      providers: [
        UsersService,
        CategoriesService,
        TransactionsService,
        { provide: ConfigService, useFactory: () => mockDeep<ConfigService>() },
        { provide: PrismaService, useFactory: () => mockDeep<PrismaService>() },
      ],
    }).compile();

    const config = module.get<ConfigService<Config>>(ConfigService) as unknown as DeepMockProxy<
      ConfigService<Config>
    >;
    mockConfig(config);

    prisma = module.get<PrismaService>(PrismaService) as unknown as DeepMockProxy<PrismaService>;
    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Creating

  it('Should create transaction', async () => {
    prisma.transaction.create.mockResolvedValueOnce(mockTransaction(1, 1, 1));
    prisma.category.findUnique.mockResolvedValueOnce(mockCategory(1, 1));

    await expect(controller.create(mockCreateDto(1, undefined, 1), authUser)).resolves.toEqual(
      plainToInstance(Transaction, mockTransaction(1, authUser.id, 1)),
    );
    expect(prisma.transaction.create).toHaveBeenCalledWith({
      data: mockCreateDto(1, authUser.id, 1),
    });
  });

  it('Should create transaction for another user as admin', async () => {
    prisma.transaction.create.mockResolvedValueOnce(mockTransaction(1, 2, 1));
    prisma.category.findUnique.mockResolvedValueOnce(mockCategory(1, 2));
    prisma.user.findUnique.mockResolvedValueOnce({ id: 2 } as any);

    await expect(controller.create(mockCreateDto(1, 2, 1), adminUser)).resolves.toEqual(
      plainToInstance(Transaction, mockTransaction(1, 2, 1)),
    );
    expect(prisma.transaction.create).toHaveBeenCalledWith({
      data: mockCreateDto(1, 2, 1),
    });
  });

  it('Should throw ForbiddenException when creating transaction for another user', async () => {
    await expect(controller.create(mockCreateDto(1, 2, 1), authUser)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  // eslint-disable-next-line max-len
  it('Should throw BadRequestException when creating transaction for missing user as admin', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(controller.create(mockCreateDto(1, 2, 1), adminUser)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  // eslint-disable-next-line max-len
  it('Should throw BadRequestException when creating transaction for missing category', async () => {
    prisma.category.findUnique.mockResolvedValueOnce(null);

    await expect(
      controller.create(mockCreateDto(1, undefined, 1), authUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // eslint-disable-next-line max-len
  it('Should throw BadRequestException when creating transaction for category mismatching user', async () => {
    prisma.category.findUnique.mockResolvedValueOnce(mockCategory(1, 2));

    await expect(
      controller.create(mockCreateDto(1, undefined, 1), authUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // eslint-disable-next-line max-len
  it('Should throw BadRequestException when creating transaction for category mismatching user as admin', async () => {
    prisma.category.findUnique.mockResolvedValueOnce(mockCategory(1, 2));

    await expect(
      controller.create(mockCreateDto(1, undefined, 1), adminUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Should return all transactions of the current user', async () => {
    prisma.transaction.findMany.mockResolvedValueOnce([
      mockTransaction(1, 1, 1),
      mockTransaction(2, 1, 1),
      mockTransaction(3, 1, 1),
    ]);
    prisma.transaction.count.mockResolvedValueOnce(3);

    await expect(controller.findAll(new PaginationInputDto(), {}, [], authUser)).resolves.toEqual(
      new FindAllDto(
        plainToInstance(Transaction, [
          mockTransaction(1, 1, 1),
          mockTransaction(2, 1, 1),
          mockTransaction(3, 1, 1),
        ]),
        new PaginationDto(new PaginationInputDto(), 3),
        {},
        [],
      ),
    );

    expect(prisma.transaction.count).toHaveBeenCalledWith({
      where: {
        userId: authUser.id,
      },
    });
    expect(prisma.transaction.findMany).toHaveBeenCalledWith({
      where: {
        userId: authUser.id,
      },
      skip: 0,
      take: 3,
      orderBy: [],
    });
  });

  it('Should return all transactions as admin', async () => {
    prisma.transaction.findMany.mockResolvedValueOnce([]);
    prisma.transaction.count.mockResolvedValueOnce(0);

    await expect(controller.findAll(new PaginationInputDto(), {}, [], adminUser)).resolves.toEqual(
      new FindAllDto([], new PaginationDto(new PaginationInputDto(), 0), {}, []),
    );
    expect(prisma.transaction.count).toHaveBeenCalledWith({
      where: {},
    });
    expect(prisma.transaction.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 0,
      orderBy: [],
    });
  });

  // Finding

  it('Should return one transaction', async () => {
    prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction(1, 1, 1));

    await expect(controller.findOne(1, authUser)).resolves.toEqual(
      plainToInstance(Transaction, mockTransaction(1, 1, 1)),
    );

    expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });
  });

  it("Should return other user's transaction for admin", async () => {
    prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction(1, 5, 1));

    await expect(controller.findOne(1, adminUser)).resolves.toEqual(
      plainToInstance(Transaction, mockTransaction(1, 5, 1)),
    );

    expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });
  });

  it("should throw ForbiddenException when accessing other user's transaction", async () => {
    prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction(1, 5, 1));

    await expect(controller.findOne(1, authUser)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should throw NotFoundException when accessing missing transaction', async () => {
    prisma.transaction.findUnique.mockResolvedValueOnce(null);

    await expect(controller.findOne(1, authUser)).rejects.toBeInstanceOf(NotFoundException);
  });

  // Updating

  it('Should update one transaction', async () => {
    prisma.transaction.update.mockResolvedValueOnce(mockTransaction(1, 1, 1));
    prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction(1, 1, 1));

    await expect(controller.update(1, mockUpdateDto(1), authUser)).resolves.toEqual(
      plainToInstance(Transaction, mockTransaction(1, 1, 1)),
    );

    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: mockUpdateDto(1),
    });
  });

  it("Should update other user's transaction for admin", async () => {
    prisma.transaction.update.mockResolvedValueOnce(mockTransaction(1, 5, 1));
    prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction(1, 5, 1));

    await expect(controller.update(1, mockUpdateDto(1), adminUser)).resolves.toEqual(
      plainToInstance(Transaction, mockTransaction(1, 5, 1)),
    );

    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: mockUpdateDto(1),
    });
  });

  it('Should move one transaction to different category', async () => {
    prisma.transaction.update.mockResolvedValueOnce(mockTransaction(1, 1, 2));
    prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction(1, 1, 1));
    prisma.category.findUnique.mockResolvedValueOnce(mockCategory(2, 1));

    await expect(controller.update(1, mockUpdateDto(1, 2), authUser)).resolves.toEqual(
      plainToInstance(Transaction, mockTransaction(1, 1, 2)),
    );

    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: mockUpdateDto(1, 2),
    });
  });

  // eslint-disable-next-line max-len
  it('Should throw BadRequestException when moving transaction to category of another user', async () => {
    prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction(1, 1, 1));
    prisma.category.findUnique.mockResolvedValueOnce(mockCategory(2, 2));

    await expect(controller.update(1, mockUpdateDto(1, 2), authUser)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  // eslint-disable-next-line max-len
  it('Should throw BadRequestException when moving transaction to category of another user as admin', async () => {
    prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction(1, 1, 1));
    prisma.category.findUnique.mockResolvedValueOnce(mockCategory(2, 2));

    await expect(controller.update(1, mockUpdateDto(1, 2), adminUser)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("should throw ForbiddenException when updating other user's transaction", async () => {
    prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction(1, 5, 1));
    prisma.transaction.update.mockResolvedValueOnce(mockTransaction(1, 5, 1));

    await expect(controller.findOne(1, authUser)).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.transaction.update).toBeCalledTimes(0);
  });

  it('should throw NotFoundException when updating missing transaction', async () => {
    prisma.transaction.findUnique.mockResolvedValueOnce(null);

    await expect(controller.update(1, mockUpdateDto(1), authUser)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // Deletion

  it('Should delete one transaction', async () => {
    prisma.transaction.delete.mockResolvedValueOnce(mockTransaction(1, 1, 1));
    prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction(1, 1, 1));

    await expect(controller.remove(1, authUser)).resolves.toEqual(
      plainToInstance(Transaction, mockTransaction(1, 1, 1)),
    );

    expect(prisma.transaction.delete).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });
  });

  it("Should delete other user's transaction for admin", async () => {
    prisma.transaction.delete.mockResolvedValueOnce(mockTransaction(1, 5, 1));
    prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction(1, 5, 1));

    await expect(controller.remove(1, adminUser)).resolves.toEqual(
      plainToInstance(Transaction, mockTransaction(1, 5, 1)),
    );

    expect(prisma.transaction.delete).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });
  });

  it("should throw ForbiddenException when deleting other user's transaction", async () => {
    prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction(1, 5, 1));
    prisma.transaction.delete.mockResolvedValueOnce(mockTransaction(1, 5, 1));

    await expect(controller.remove(1, authUser)).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.transaction.delete).toBeCalledTimes(0);
  });

  it('should throw NotFoundException when deleting missing transaction', async () => {
    prisma.transaction.findUnique.mockResolvedValueOnce(null);

    await expect(controller.remove(1, authUser)).rejects.toBeInstanceOf(NotFoundException);
  });
});
