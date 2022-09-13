import { User } from '../users/entities/user.entity';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from '../prisma/prisma.service';
import { UsersController } from '../users/users.controller';
import { CategoriesController } from './categories.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { plainToInstance } from 'class-transformer';
import { UsersService } from '../users/users.service';
import { CategoriesService } from './categories.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { PrismaError } from 'prisma-error-enum';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config';
import { mockConfig } from '../../test/test-utils';
import { PaginationDto, PaginationInputDto } from '../base-entity/dto/pagination.dto';
import { FindAllDto } from '../base-entity/dto/find-all.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let prisma: DeepMockProxy<PrismaService>;
  let service: CategoriesService;
  const authUser = new User(1, 'user1', 'user1_display', '', false, new Date());
  const adminUser = new User(1, 'user1', 'user1_display', '', true, new Date());

  const mockCategory = (id: number, userId: number): Category => {
    return {
      id: id,
      label: `label_${id}`,
      userId: userId,
    };
  };
  const mockCreateDto = (id: number, userId?: number): CreateCategoryDto => {
    const category: CreateCategoryDto = {
      label: `label_${id}`,
    };
    if (userId !== undefined) category.userId = userId;
    return category;
  };
  const mockUpdateDto = (id: number): UpdateCategoryDto => {
    return {
      label: `label_${id}`,
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController, CategoriesController],
      providers: [
        UsersService,
        CategoriesService,
        { provide: ConfigService, useFactory: () => mockDeep<ConfigService>() },
        { provide: PrismaService, useFactory: () => mockDeep<PrismaService>() },
      ],
    }).compile();

    const config = module.get<ConfigService<Config>>(ConfigService) as unknown as DeepMockProxy<
      ConfigService<Config>
    >;
    mockConfig(config);

    prisma = module.get<PrismaService>(PrismaService) as unknown as DeepMockProxy<PrismaService>;
    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Creating

  it('Should create category', async () => {
    prisma.category.create.mockResolvedValueOnce(mockCategory(1, 1));

    await expect(controller.create(mockCreateDto(1), authUser)).resolves.toEqual(
      plainToInstance(Category, mockCategory(1, authUser.id)),
    );
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: {
        ...mockCreateDto(1, authUser.id),
      },
    });
  });

  it('Should create category for another user as admin', async () => {
    prisma.category.create.mockResolvedValueOnce(mockCategory(1, 2));
    prisma.user.findUnique.mockResolvedValueOnce({ id: 2 } as any);

    await expect(controller.create(mockCreateDto(1, 2), adminUser)).resolves.toEqual(
      plainToInstance(Category, mockCategory(1, 2)),
    );
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: {
        ...mockCreateDto(1, 2),
      },
    });
  });

  it('Should throw ForbiddenException when creating category for another user', async () => {
    await expect(controller.create(mockCreateDto(1, 2), authUser)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  // eslint-disable-next-line max-len
  it('Should throw BadRequestException when creating category for missing user as admin', async () => {
    prisma.category.create.mockResolvedValueOnce(mockCategory(1, 2));
    prisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(controller.create(mockCreateDto(1, 2), adminUser)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should throw ConflictException on creation conflict', async () => {
    prisma.category.create.mockRejectedValueOnce(
      new PrismaClientKnownRequestError('', PrismaError.UniqueConstraintViolation, '', {
        target: ['label'],
      }),
    );

    await expect(controller.create(mockCreateDto(2), authUser)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('Should return all categories of the current user', async () => {
    prisma.category.findMany.mockResolvedValueOnce([
      mockCategory(1, 1),
      mockCategory(2, 1),
      mockCategory(3, 1),
    ]);
    prisma.category.count.mockResolvedValueOnce(3);

    await expect(controller.findAll(new PaginationInputDto(), {}, [], authUser)).resolves.toEqual(
      new FindAllDto(
        plainToInstance(Category, [
          service.defaultCategory(authUser.id),
          mockCategory(1, 1),
          mockCategory(2, 1),
          mockCategory(3, 1),
        ]),
        new PaginationDto(new PaginationInputDto(), 3),
        {},
        [],
      ),
    );
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: {
        userId: authUser.id,
      },
      skip: 0,
      take: 3,
      orderBy: [],
    });
  });

  it('Should return all categories as admin', async () => {
    prisma.category.findMany.mockResolvedValueOnce([]);
    prisma.category.count.mockResolvedValueOnce(0);

    await expect(controller.findAll(new PaginationInputDto(), {}, [], adminUser)).resolves.toEqual(
      new FindAllDto(
        plainToInstance(Category, [service.defaultCategory(adminUser.id)]),
        new PaginationDto(new PaginationInputDto(), 0),
        {},
        [],
      ),
    );
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 0,
      orderBy: [],
    });
  });

  // Finding

  it('Should return one category', async () => {
    prisma.category.findUnique.mockResolvedValueOnce(mockCategory(1, 1));

    await expect(controller.findOne(1, authUser)).resolves.toEqual(
      plainToInstance(Category, mockCategory(1, 1)),
    );

    expect(prisma.category.findUnique).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });
  });

  it('Should return default category', async () => {
    await expect(controller.findOne(-1, authUser)).resolves.toEqual(
      plainToInstance(Category, service.defaultCategory(authUser.id)),
    );
  });

  it("Should return other user's category for admin", async () => {
    prisma.category.findUnique.mockResolvedValueOnce(mockCategory(1, 5));

    await expect(controller.findOne(1, adminUser)).resolves.toEqual(
      plainToInstance(Category, mockCategory(1, 5)),
    );

    expect(prisma.category.findUnique).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });
  });

  it("should throw ForbiddenException when accessing other user's category", async () => {
    prisma.category.findUnique.mockResolvedValueOnce(mockCategory(1, 5));

    await expect(controller.findOne(1, authUser)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should throw NotFoundException when accessing missing category', async () => {
    prisma.category.findUnique.mockResolvedValueOnce(null);

    await expect(controller.findOne(1, authUser)).rejects.toBeInstanceOf(NotFoundException);
  });

  // Updating

  it('Should update one category', async () => {
    prisma.category.update.mockResolvedValueOnce(mockCategory(1, 1));
    prisma.category.findUnique.mockResolvedValueOnce(mockCategory(1, 1));

    await expect(controller.update(1, mockUpdateDto(1), authUser)).resolves.toEqual(
      plainToInstance(Category, mockCategory(1, 1)),
    );

    expect(prisma.category.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: mockUpdateDto(1),
    });
  });

  it("Should update other user's category for admin", async () => {
    prisma.category.update.mockResolvedValueOnce(mockCategory(1, 5));
    prisma.category.findUnique.mockResolvedValueOnce(mockCategory(1, 5));

    await expect(controller.update(1, mockUpdateDto(1), adminUser)).resolves.toEqual(
      plainToInstance(Category, mockCategory(1, 5)),
    );

    expect(prisma.category.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: mockUpdateDto(1),
    });
  });

  it("should throw ForbiddenException when updating other user's category", async () => {
    prisma.category.findUnique.mockResolvedValueOnce(mockCategory(1, 5));
    prisma.category.update.mockResolvedValueOnce(mockCategory(1, 5));

    await expect(controller.findOne(1, authUser)).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.category.update).toBeCalledTimes(0);
  });

  it('should throw ForbiddenException when updating default category', async () => {
    await expect(controller.update(-1, mockUpdateDto(-1), authUser)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(prisma.category.update).toBeCalledTimes(0);
  });

  it('should throw NotFoundException when updating missing category', async () => {
    prisma.category.findUnique.mockResolvedValueOnce(null);

    await expect(controller.update(1, mockUpdateDto(1), authUser)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // Deletion

  it('Should delete one category', async () => {
    prisma.category.delete.mockResolvedValueOnce(mockCategory(1, 1));
    prisma.category.findUnique.mockResolvedValueOnce(mockCategory(1, 1));

    await expect(controller.remove(1, authUser)).resolves.toEqual(
      plainToInstance(Category, mockCategory(1, 1)),
    );

    expect(prisma.category.delete).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });
  });

  it("Should delete other user's category as admin", async () => {
    prisma.category.delete.mockResolvedValueOnce(mockCategory(1, 5));
    prisma.category.findUnique.mockResolvedValueOnce(mockCategory(1, 5));

    await expect(controller.remove(1, adminUser)).resolves.toEqual(
      plainToInstance(Category, mockCategory(1, 5)),
    );

    expect(prisma.category.delete).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });
  });

  it("should throw ForbiddenException when deleting other user's category", async () => {
    prisma.category.findUnique.mockResolvedValueOnce(mockCategory(1, 5));
    prisma.category.delete.mockResolvedValueOnce(mockCategory(1, 5));

    await expect(controller.remove(1, authUser)).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.category.delete).toBeCalledTimes(0);
  });

  it('should throw ForbiddenException when deleting default category', async () => {
    await expect(controller.remove(-1, authUser)).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.category.delete).toBeCalledTimes(0);
  });

  it('should throw NotFoundException when deleting missing category', async () => {
    prisma.category.findUnique.mockResolvedValueOnce(null);

    await expect(controller.remove(1, authUser)).rejects.toBeInstanceOf(NotFoundException);
  });
});
