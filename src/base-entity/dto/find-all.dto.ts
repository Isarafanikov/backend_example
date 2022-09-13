import { PaginationDto } from './pagination.dto';
import { IsArray } from 'class-validator';

export class FindAllDto<T> {
  /**
   * Returned items
   */
  @IsArray()
  content: T[];

  /**
   * Pagination info
   */
  pagination: PaginationDto;

  /**
   * Sort query
   */
  sort: object[];

  /**
   * Filter query
   */
  filter: object;

  constructor(content: T[], pagination: PaginationDto, filter: object = {}, sort: object[] = []) {
    this.content = content;
    this.pagination = pagination;
    this.sort = sort;
    this.filter = filter;
  }
}
