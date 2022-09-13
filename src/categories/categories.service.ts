import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BaseEntityService } from '../base-entity/base-entity.service';
import { Category } from './entities/category.entity';
import { Category as PrismaCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { SortCategoryDto } from './dto/sort-category.dto';
import { PaginationDto } from '../base-entity/dto/pagination.dto';

@Injectable()
export class CategoriesService extends BaseEntityService<
  Category,
  PrismaCategory,
  CreateCategoryDto,
  UpdateCategoryDto,
  FilterCategoryDto,
  SortCategoryDto
> {
  public static readonly defaultCategoryId = -1;
  private readonly defaultCategoryLabel;

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private configService: ConfigService<Config>,
  ) {
    super(Category);
    this.defaultCategoryLabel = configService.get<string>('DEFAULT_CATEGORY_NAME', 'other');
  }

  public defaultCategory(userId: number): Category {
    return {
      id: CategoriesService.defaultCategoryId,
      label: this.defaultCategoryLabel,
      userId: userId,
    };
  }

  protected async _create(createDto: CreateCategoryDto, authUser?: User): Promise<PrismaCategory> {
    if (createDto.label == this.defaultCategoryLabel)
      throw new ConflictException(
        `Can't create category with label matching default category label`,
      );
    const id = createDto.userId ?? authUser?.id;
    if (id === undefined) {
      throw new BadRequestException('Missing userId field');
    }
    if (id !== authUser?.id) {
      try {
        await this.usersService.findOne(id, authUser);
      } catch (e) {
        if (e instanceof NotFoundException) {
          throw new BadRequestException('Provided userId is invalid');
        } else if (e instanceof ForbiddenException) {
          throw new ForbiddenException(
            "Non-admins can't manipulate categories on behalf of other users",
          );
        }
        throw e;
      }
    }

    return this.prisma.category.create({
      data: {
        ...createDto,
        userId: id,
      },
    });
  }

  protected _countAll(authUser?: User, filter?: FilterCategoryDto): Promise<number> {
    const where = { ...filter };
    if (authUser !== undefined && !authUser.admin) {
      where.userId = authUser.id;
    }
    return this.prisma.category.count({
      where: where,
    });
  }

  protected async _findAll(
    pagination: PaginationDto,
    filter?: FilterCategoryDto,
    sort?: SortCategoryDto[],
    authUser?: User,
  ): Promise<PrismaCategory[]> {
    const where = { ...filter };
    if (authUser !== undefined && !authUser.admin) {
      where.userId = authUser.id;
    }

    const categories = await this.prisma.category.findMany({
      where: where,
      orderBy: sort,
      skip: pagination.skip,
      take: pagination.limit,
    });
    categories.unshift(this.defaultCategory(authUser?.id ?? 0));
    return categories;
  }

  protected async _findOne(id: number, authUser?: User): Promise<PrismaCategory | null> {
    if (id == CategoriesService.defaultCategoryId) return this.defaultCategory(authUser?.id ?? 0);
    const category = await this.prisma.category.findUnique({
      where: {
        id: id,
      },
    });
    if (
      category != null &&
      authUser !== undefined &&
      !authUser.admin &&
      category.userId != authUser.id
    ) {
      throw new ForbiddenException("Non-admins can't access categories of other users");
    }
    return category;
  }

  protected async _remove(id: number, authUser?: User): Promise<PrismaCategory> {
    if (id == CategoriesService.defaultCategoryId) {
      throw new ForbiddenException("Can't delete default category");
    }

    // If user have no rights to access, or entry is missing, exception will be thrown
    await this.findOne(id, authUser);

    await this.prisma.transaction.updateMany({
      where: {
        categoryId: id,
      },
      data: {
        categoryId: -1,
      },
    });

    return this.prisma.category.delete({
      where: {
        id: id,
      },
    });
  }

  protected async _update(
    id: number,
    updateDto: UpdateCategoryDto,
    authUser?: User,
  ): Promise<PrismaCategory> {
    if (id == CategoriesService.defaultCategoryId) {
      throw new ForbiddenException("Can't modify default category");
    }

    // If user have no rights to access, or entry is missing, exception will be thrown
    await this.findOne(id, authUser);

    return this.prisma.category.update({
      where: {
        id: id,
      },
      data: updateDto,
    });
  }
}
