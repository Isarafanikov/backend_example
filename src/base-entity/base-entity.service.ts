import { plainToInstance } from 'class-transformer';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { PrismaError } from 'prisma-error-enum';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { User } from '../users/entities/user.entity';
import { FindAllDto } from './dto/find-all.dto';
import { PaginationDto, PaginationInputDto } from './dto/pagination.dto';

/**
 * Base class for all entity services
 * @template Entity, DatabaseEntity, CreateDto, UpdateDto
 */
export abstract class BaseEntityService<
  Entity extends object,
  DatabaseEntity extends object,
  CreateDto extends object,
  UpdateDto extends object,
  FilterDto extends object,
  SortDto extends object,
> {
  private readonly cls: Type<Entity>;

  protected constructor(cls: Type<Entity>) {
    this.cls = cls;
  }

  /**
   * Creates new {@link Entity} based on provided {@link createDto}
   * @param createDto - creation DTO
   * @param authUser - authorized user
   * @return Created {@link Entity}
   * @throws {ConflictException} if entity creation resulted in a conflict
   */
  public async create(createDto: CreateDto, authUser?: User): Promise<Entity> {
    return await this.runAndConvert(this._create, createDto, authUser);
  }

  /**
   * Returns an array of all {@link Entity}s
   * @param paginationInput - pagination options
   * @param filter - filter object
   * @param sort - sort objets array. Results are sorted by earlier elements, applying next order
   * @param authUser - authorized user
   * only in case if elements are equal by the previous measure\
   */
  public async findAll(
    paginationInput: PaginationInputDto,
    filter?: FilterDto,
    sort?: SortDto[],
    authUser?: User,
  ): Promise<FindAllDto<Entity>> {
    const count = await this._countAll(authUser, filter);
    const pagination = new PaginationDto(paginationInput, count);

    const entities = await this.runAndConvert(
      this._findAll,
      pagination,
      filter,
      sort ?? [],
      authUser,
    );
    return new FindAllDto<Entity>(entities, pagination, filter, sort);
  }

  /**
   * Returns one {@link Entity} with matching {@link id}
   * @param id - id of the required entity
   * @param authUser - authorized user
   * @return {@link Entity}
   * @throws {NotFoundException} if entity couldn't be found
   */
  public async findOne(id: number, authUser?: User): Promise<Entity> {
    const entity = await this.runAndConvert(this._findOne, id, authUser);
    if (entity === null) {
      throw new NotFoundException();
    }
    return entity;
  }

  /**
   * Updates {@link Entity} with matching {@link id} using provided {updateDto}
   * @param id - id of the required entity
   * @param updateDto - update DTO
   * @param authUser - authorized user
   * @return Updated {@link Entity}
   * @throws {ConflictException} if entity update resulted in a conflict
   * @throws {NotFoundException} if entity couldn't be found
   */
  public update(id: number, updateDto: UpdateDto, authUser?: User): Promise<Entity> {
    return this.runAndConvert(this._update, id, updateDto, authUser);
  }

  /**
   * Removes one {@link Entity} with matching {@link id}
   * @param id - id of the required entity
   * @param authUser - authorized user
   * @return Deleted {@link Entity}
   * @throws {NotFoundException} if entity couldn't be found
   */
  public remove(id: number, authUser?: User): Promise<Entity> {
    return this.runAndConvert(this._remove, id, authUser);
  }

  /**
   * Runs given code, converting returned values array to {@link Entity} array
   *
   * @param code - function to run
   * @param args - function arguments
   * @protected
   */
  protected async runAndConvert<
    Func extends (...args: any[]) => Promise<DatabaseEntity[]>,
    Args extends Parameters<Func>,
  >(code: Func, ...args: Args): Promise<Entity[]>;

  /**
   * Runs given code, converting returned value to an instance of {@link Entity}
   *
   * @param code - function to run
   * @param args - function arguments
   * @protected
   */
  protected async runAndConvert<
    Func extends (...args: any[]) => Promise<DatabaseEntity>,
    Args extends Parameters<Func>,
  >(code: Func, ...args: Args): Promise<Entity>;

  /**
   * Runs given code, converting returned value to an instance of {@link Entity}, or
   * returning {@link null} if provided code returned null
   *
   * @param code - function to run
   * @param args - function arguments
   * @protected
   */
  protected async runAndConvert<
    Func extends (...args: any[]) => Promise<DatabaseEntity | null>,
    Args extends Parameters<Func>,
  >(code: Func, ...args: Args): Promise<Entity | null>;

  protected async runAndConvert<
    Func extends (...args: any[]) => Promise<null | DatabaseEntity>,
    Args extends Parameters<Func>,
  >(code: Func, ...args: Args): Promise<null | Entity | Entity[]> {
    try {
      const value = await code.bind(this)(...args);
      if (value === null) return null;
      return plainToInstance(this.cls, value);
    } catch (e) {
      throw this.improveError(e);
    }
  }

  /**
   * Tries to generate informative http errors based on caught database errors
   * @param error caught error
   * @protected
   */
  protected improveError(error: unknown): unknown {
    if (error instanceof PrismaClientKnownRequestError) {
      const entityName = this.cls.name || 'Entity';
      switch (error.code) {
        case PrismaError.UniqueConstraintViolation:
          return new ConflictException(
            `Unique fields [${(((error?.meta as any)?.target as Array<string>) ?? []).join(
              ', ',
            )}] cause conflict with another ${entityName}`,
          );
        case PrismaError.RecordsNotFound:
          return new NotFoundException(`${entityName} wasn't found`);
      }
    }
    return error;
  }

  protected abstract _create(createDto: CreateDto, authUser?: User): Promise<DatabaseEntity>;

  protected abstract _countAll(authUser?: User, filter?: FilterDto): Promise<number>;

  protected abstract _findAll(
    pagination: PaginationDto,
    filter?: FilterDto,
    sort?: SortDto[],
    authUser?: User,
  ): Promise<DatabaseEntity[]>;

  protected abstract _findOne(id: number, authUser?: User): Promise<DatabaseEntity | null>;

  protected abstract _update(
    id: number,
    updateDto: UpdateDto,
    authUser?: User,
  ): Promise<DatabaseEntity>;

  protected abstract _remove(id: number, authUser?: User): Promise<DatabaseEntity>;
}
