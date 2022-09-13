import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Category } from './entities/category.entity';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { User } from '../users/entities/user.entity';
import {
  FilterQuery,
  PaginationQuery,
  SortQuery,
} from '../base-entity/decorators/query.decorators';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { SortCategoryDto } from './dto/sort-category.dto';
import { FindAllDto } from '../base-entity/dto/find-all.dto';
import { ApiPaginatedDto } from '../base-entity/decorators/api-find-all.decorator';
import { PaginationInputDto } from '../base-entity/dto/pagination.dto';
import { ApiFindAllQuery } from '../base-entity/decorators/api-find-all-query.decorator';

@ApiBearerAuth()
@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}

  /**
   * Creates a new Category from provided DTO
   */
  @ApiCreatedResponse({
    description: 'The Category has been created successfully.',
    type: Category,
  })
  @ApiConflictResponse({
    description: 'Category with this label is already defined by another category for this user',
  })
  @ApiBadRequestResponse({
    description: "User with provided ID doesn't exists",
  })
  @ApiForbiddenResponse({
    description: "Non-admins can't manipulate categories on behalf of other users",
  })
  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @AuthUser() authUser: User,
  ): Promise<Category> {
    return this.categoryService.create(createCategoryDto, authUser);
  }

  /**
   * Returns a list of all Categories visible to current user
   */
  @Get()
  @ApiFindAllQuery(FilterCategoryDto, SortCategoryDto)
  @ApiPaginatedDto(Category)
  findAll(
    @PaginationQuery() pagination: unknown,
    @FilterQuery(FilterCategoryDto) filter: unknown,
    @SortQuery(SortCategoryDto) sort: Partial<SortCategoryDto>[],
    @AuthUser() authUser: User,
  ): Promise<FindAllDto<Category>> {
    return this.categoryService.findAll(
      pagination as PaginationInputDto,
      filter as FilterCategoryDto,
      sort,
      authUser,
    );
  }

  /**
   * Returns Category with a provided id
   */
  @ApiOkResponse({
    description: 'The Category has been found successfully',
    type: Category,
  })
  @ApiNotFoundResponse({
    description: 'Category with specified id was not found',
  })
  @ApiForbiddenResponse({
    description: "Non-admins can't access Categories of other users",
  })
  @Get(':id')
  findOne(@Param('id') id: number, @AuthUser() authUser: User): Promise<Category> {
    return this.categoryService.findOne(+id, authUser);
  }

  /**
   * Updates a Category with provided data.
   */
  @ApiOkResponse({
    description: 'The Category has been updated successfully',
    type: Category,
  })
  @ApiConflictResponse({
    description: 'Category with this label is already defined by another category for this user',
  })
  @ApiNotFoundResponse({
    description: 'Category with specified id was not found',
  })
  @ApiForbiddenResponse({
    description:
      "Default category can't be modified<br>Non-admins can't access categories of other users",
  })
  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @AuthUser() authUser: User,
  ): Promise<Category> {
    return this.categoryService.update(+id, updateCategoryDto, authUser);
  }

  /**
   * Deletes a Category with a given Id.
   */
  @ApiOkResponse({
    description: 'The Category has been deleted successfully',
    type: Category,
  })
  @ApiNotFoundResponse({
    description: 'Category with specified id was not found',
  })
  @ApiForbiddenResponse({
    description:
      "Default category can't be deleted<br>Non-admins can't access categories of other users",
  })
  @Delete(':id')
  remove(@Param('id') id: number, @AuthUser() authUser: User): Promise<Category> {
    return this.categoryService.remove(+id, authUser);
  }
}
