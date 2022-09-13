import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import {
  FilterQuery,
  PaginationQuery,
  SortQuery,
} from '../base-entity/decorators/query.decorators';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { SortTransactionDto } from './dto/sort-transaction.dto';
import { FindAllDto } from '../base-entity/dto/find-all.dto';
import { ApiPaginatedDto } from '../base-entity/decorators/api-find-all.decorator';
import { PaginationInputDto } from '../base-entity/dto/pagination.dto';
import { ApiFindAllQuery } from '../base-entity/decorators/api-find-all-query.decorator';

@ApiExtraModels(Transaction)
@ApiExtraModels(FindAllDto)
@ApiBearerAuth()
@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * Creates a new Transaction from provided DTO
   */
  @ApiCreatedResponse({
    description: 'The Transaction has been successfully created.',
    type: Category,
  })
  @ApiConflictResponse({
    description: 'Transaction with this label is already defined by another category for this user',
  })
  @ApiBadRequestResponse({
    description: "User with provided ID doesn't exist<br>Category with provided ID doesn't exist",
  })
  @ApiForbiddenResponse({
    description:
      "Non-admins can't manipulate transactions on behalf of other users<br>" +
      "Provided category doesn't belong to the provided user",
  })
  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @AuthUser() authUser: User,
  ): Promise<Transaction> {
    return this.transactionsService.create(createTransactionDto, authUser);
  }

  /**
   * Returns a list of all Transactions visible to current user
   */
  @Get()
  @ApiFindAllQuery(FilterTransactionDto, SortTransactionDto)
  @ApiPaginatedDto(Transaction)
  findAll(
    @PaginationQuery() pagination: unknown,
    @FilterQuery(FilterTransactionDto) filter: unknown,
    @SortQuery(SortTransactionDto) sort: Partial<SortTransactionDto>[],
    @AuthUser() authUser: User,
  ): Promise<FindAllDto<Transaction>> {
    return this.transactionsService.findAll(
      pagination as PaginationInputDto,
      filter as FilterTransactionDto,
      sort,
      authUser,
    );
  }

  /**
   * Returns Transaction with a provided id
   */
  @ApiOkResponse({
    description: 'The Transaction has been found successfully',
    type: Category,
  })
  @ApiNotFoundResponse({
    description: 'Transaction with specified id was not found',
  })
  @ApiForbiddenResponse({
    description: "Non-admins can't access Transactions of other users",
  })
  @Get(':id')
  findOne(@Param('id') id: number, @AuthUser() authUser: User): Promise<Transaction> {
    return this.transactionsService.findOne(+id, authUser);
  }

  /**
   * Updates a Transaction with provided data.
   */
  @ApiOkResponse({
    description: 'The Transaction has been updated successfully',
    type: Category,
  })
  @ApiNotFoundResponse({
    description: 'Transaction with specified id was not found',
  })
  @ApiForbiddenResponse({
    description: "Non-admins can't access Transactions of other users",
  })
  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @AuthUser() authUser: User,
  ): Promise<Transaction> {
    return this.transactionsService.update(+id, updateTransactionDto, authUser);
  }

  /**
   * Deletes a Transaction with a given Id.
   */
  @ApiOkResponse({
    description: 'The Transaction has been deleted successfully',
    type: Category,
  })
  @ApiNotFoundResponse({
    description: 'Transaction with specified id was not found',
  })
  @ApiForbiddenResponse({
    description: "Non-admins can't access Transactions of other users",
  })
  @Delete(':id')
  remove(@Param('id') id: number, @AuthUser() authUser: User): Promise<Transaction> {
    return this.transactionsService.remove(+id, authUser);
  }
}
