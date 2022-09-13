/* eslint-disable @typescript-eslint/no-inferrable-types */
import { IsInt, IsOptional } from 'class-validator';

export class PaginationDto {
  /**
   * Current page. May be -1 if `skip` option was provided and result doesn't align with any page
   */
  @IsInt()
  @IsOptional()
  public page: number = -1;

  /**
   * Amount of elements to skip. Will be automatically calculated if `page` is provided
   */
  @IsInt()
  @IsOptional()
  public skip: number = 0;

  /**
   * Amount of elements per page, or amount of elements to take if `skip` is provided
   */
  @IsInt()
  @IsOptional()
  public limit: number = 0;

  /**
   * Total amount of pages. Last page may have fewer elements than the `limit`
   */
  @IsInt()
  public totalPages: number = 0;

  /**
   * Total amount of elements
   */
  @IsInt()
  public totalElements: number = 0;

  /**
   * Indicates if `page` is the first page
   */
  @IsInt()
  public isFistPage: boolean = false;

  /**
   * Indicates if `page` is the last page
   */
  @IsInt()
  public isLastPage: boolean = false;

  constructor(input: Pick<PaginationDto, 'page' | 'skip' | 'limit'>, count: number) {
    if (input === undefined) return;
    if (input.limit == 0) this.limit = count;
    else {
      this.limit = input.limit;
    }
    if (input.page >= 0) {
      this.page = input.page;
      this.skip = input.page * this.limit;
    } else {
      this.skip = input.skip;
      if (this.limit !== 0) {
        const rawPage = this.skip / this.limit;
        if (Math.floor(rawPage) === rawPage) {
          this.page = rawPage;
        }
      } else if (this.skip === 0) {
        this.page = 0;
      }
    }
    this.totalElements = count;
    this.totalPages = this.limit === 0 ? 1 : Math.ceil(count / this.limit);
    this.isFistPage = this.page === 0;
    this.isLastPage = this.page === this.totalPages - 1;
  }
}

export class PaginationInputDto {
  /**
   * Current page. May be -1 if `skip` option was provided and result doesn't align with any page
   */
  @IsInt()
  @IsOptional()
  public page: number = -1;

  /**
   * Amount of elements to skip. Will be automatically calculated if `page` is provided
   */
  @IsInt()
  @IsOptional()
  public skip: number = 0;

  /**
   * Amount of elements per page, or amount of elements to take if `skip` is provided
   */
  @IsInt()
  @IsOptional()
  public limit: number = 0;
}
