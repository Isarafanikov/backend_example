import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { SetAdminDto } from './dto/set-admin.dto';
import {
  FilterQuery,
  PaginationQuery,
  SortQuery,
} from '../base-entity/decorators/query.decorators';
import { FilterUserDto } from './dto/filter-user.dto';
import { SortUserDto } from './dto/sort-user.dto';
import { FindAllDto } from '../base-entity/dto/find-all.dto';
import { ApiPaginatedDto } from '../base-entity/decorators/api-find-all.decorator';
import { PaginationInputDto } from '../base-entity/dto/pagination.dto';
import { ApiFindAllQuery } from '../base-entity/decorators/api-find-all-query.decorator';

@ApiExtraModels(FindAllDto)
@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Creates a new user from provided DTO
   */
  @ApiCreatedResponse({
    description: 'The user has been successfully created',
    type: User,
  })
  @ApiConflictResponse({
    description: 'Username is already used by another user',
  })
  @Post()
  create(@Body() createUserDto: CreateUserDto, @AuthUser() authUser: User): Promise<User> {
    return this.usersService.create(createUserDto, authUser);
  }

  /**
   * Returns a list of all Users.<br>Will only return current user for non-admin requests
   */
  @Get()
  @ApiFindAllQuery(FilterUserDto, SortUserDto)
  @ApiPaginatedDto(User)
  findAll(
    @PaginationQuery() pagination: unknown,
    @FilterQuery(FilterUserDto) filter: unknown,
    @SortQuery(SortUserDto) sort: SortUserDto[],
    @AuthUser() authUser: User,
  ): Promise<FindAllDto<User>> {
    return this.usersService.findAll(
      pagination as PaginationInputDto,
      filter as FilterUserDto,
      sort,
      authUser,
    );
  }

  /**
   * Returns currently authenticated user
   */
  @ApiOkResponse({
    description: 'User info has been fetched found',
    type: User,
  })
  @Get('self')
  findSelf(@AuthUser() authUser: User): Promise<User> {
    return this.usersService.findOne(authUser.id, authUser);
  }

  /**
   * Returns User with a provided id
   */
  @ApiOkResponse({
    description: 'The User has been successfully found',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'User with specified id was not found',
  })
  @ApiForbiddenResponse({
    description: "Non-admins can't access data of other users",
  })
  @Get(':id')
  findOne(@Param('id') id: number, @AuthUser() authUser: User): Promise<User> {
    return this.usersService.findOne(+id, authUser);
  }

  /**
   * Updates currently authenticated user
   */
  @ApiOkResponse({
    description: 'The User has been successfully updated',
    type: User,
  })
  @ApiConflictResponse({
    description: 'Username is already used by another user',
  })
  @Patch('self')
  updateSelf(@Body() updateUserDto: UpdateUserDto, @AuthUser() authUser: User): Promise<User> {
    return this.usersService.update(authUser.id, updateUserDto, authUser);
  }

  /**
   * Updates a User with provided data.
   */
  @ApiOkResponse({
    description: 'The User has been successfully updated',
    type: User,
  })
  @ApiConflictResponse({
    description: 'Username is already used by another user',
  })
  @ApiNotFoundResponse({
    description: 'User with specified id was not found',
  })
  @ApiForbiddenResponse({
    description: "Non-admins can't access data of other users",
  })
  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
    @AuthUser() authUser: User,
  ): Promise<User> {
    return this.usersService.update(+id, updateUserDto, authUser);
  }

  /**
   * Deletes currently authenticated user
   */
  @ApiOkResponse({
    description: 'The User has been successfully removed',
    type: User,
  })
  @Delete('self')
  removeSelf(@AuthUser() authUser: User): Promise<User> {
    return this.usersService.remove(authUser.id, authUser);
  }

  /**
   * Deletes a user with a given Id.
   */
  @ApiOkResponse({
    description: 'The User has been successfully removed',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'User with specified id was not found',
  })
  @ApiForbiddenResponse({
    description: "Non-admins can't access data of other users",
  })
  @Delete(':id')
  remove(@Param('id') id: number, @AuthUser() authUser: User): Promise<User> {
    return this.usersService.remove(+id, authUser);
  }

  /**
   * Sets target user as admin<br>
   * Password is required for validation
   */
  @ApiOkResponse({
    description: 'Operation successful',
  })
  @ApiForbiddenResponse({
    description: 'Only admin users can manipulate admin permissions',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid password',
  })
  @Patch('setAdmin/:id')
  setAdmin(
    @Param('id') id: number,
    @Body() adminDto: SetAdminDto,
    @AuthUser() authUser: User,
  ): Promise<void> {
    return this.usersService.validateAndSetAdmin(id, adminDto, authUser);
  }
}
