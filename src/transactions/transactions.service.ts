import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { BaseEntityService } from '../base-entity/base-entity.service';
import { Transaction } from './entities/transaction.entity';
import { Transaction as PrismaTransaction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CategoriesService } from '../categories/categories.service';
import { Category } from '../categories/entities/category.entity';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { SortTransactionDto } from './dto/sort-transaction.dto';
import { PaginationDto } from '../base-entity/dto/pagination.dto';

@Injectable()
export class TransactionsService extends BaseEntityService<
  Transaction,
  PrismaTransaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  FilterTransactionDto,
  SortTransactionDto
> {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private categoriesService: CategoriesService,
  ) {
    super(Transaction);
  }

  private async verifyCategory(categoryId: number, userId: number, authUser?: User): Promise<void> {
    // Verifying category
    let category: Category;
    try {
      category = await this.categoriesService.findOne(categoryId, authUser);
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw new BadRequestException('Provided categoryId is invalid');
      } else if (e instanceof ForbiddenException) {
        throw new BadRequestException("Provided category doesn't belong to the provided user");
      }
      throw e;
    }
    if (category.userId != userId) {
      throw new BadRequestException("Provided category doesn't belong to the provided user");
    }
  }

  protected async _create(
    createDto: CreateTransactionDto,
    authUser?: User,
  ): Promise<PrismaTransaction> {
    // Verifying user
    const userId = createDto.userId ?? authUser?.id;
    if (userId === undefined) {
      throw new BadRequestException('Missing userId field');
    }
    if (userId !== authUser?.id) {
      try {
        await this.usersService.findOne(userId, authUser);
      } catch (e) {
        if (e instanceof NotFoundException) {
          throw new BadRequestException('Provided userId is invalid');
        }
        throw e;
      }
    }

    createDto.date ??= new Date();
    createDto.categoryId ??= CategoriesService.defaultCategoryId;

    await this.verifyCategory(createDto.categoryId, userId, authUser);

    const created = await this.prisma.transaction.create({
      data: {
        ...createDto,
        userId: userId,
        categoryId:
          createDto.categoryId === CategoriesService.defaultCategoryId
            ? null
            : createDto.categoryId,
      },
    });
    created.categoryId ??= CategoriesService.defaultCategoryId;
    return created;
  }

  protected _countAll(authUser?: User, filter?: FilterTransactionDto): Promise<number> {
    const where = { ...filter };
    if (authUser !== undefined && !authUser.admin) {
      where.userId = authUser.id;
    }
    return this.prisma.transaction.count({
      where: where,
    });
  }

  protected _findAll(
    pagination: PaginationDto,
    filter?: FilterTransactionDto,
    sort?: SortTransactionDto[],
    authUser?: User,
  ): Promise<PrismaTransaction[]> {
    const where = { ...filter };
    if (authUser !== undefined && !authUser.admin) {
      where.userId = authUser.id;
    }
    return this.prisma.transaction.findMany({
      where: where,
      orderBy: sort,
      skip: pagination.skip,
      take: pagination.limit,
    });
  }

  protected async _findOne(id: number, authUser?: User): Promise<PrismaTransaction | null> {
    const found = await this.prisma.transaction.findUnique({
      where: {
        id: id,
      },
    });
    if (found != null) found.categoryId ??= CategoriesService.defaultCategoryId;
    if (found != null && authUser !== undefined && !authUser.admin && found.userId != authUser.id) {
      throw new ForbiddenException("Non-admins can't access Transactions of other users");
    }
    return found;
  }

  protected async _remove(id: number, authUser?: User): Promise<PrismaTransaction> {
    // If user have no rights to access, or entry is missing, exception will be thrown
    await this.findOne(id, authUser);

    return this.prisma.transaction.delete({
      where: {
        id: id,
      },
    });
  }

  protected async _update(
    id: number,
    updateDto: UpdateTransactionDto,
    authUser?: User,
  ): Promise<PrismaTransaction> {
    // If user have no rights to access, or entry is missing, exception will be thrown
    const transaction = await this.findOne(id, authUser);

    if (updateDto.categoryId !== undefined) {
      await this.verifyCategory(updateDto.categoryId, transaction.userId, authUser);
    }

    return this.prisma.transaction.update({
      where: {
        id: id,
      },
      data: updateDto,
    });
  }
}
