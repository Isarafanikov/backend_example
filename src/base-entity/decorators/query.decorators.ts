import { Query } from '@nestjs/common';
import { FilteringPipe } from '../pipes/filtering-pipe';
import { Type } from '@nestjs/passport';
import { SortingPipe } from '../pipes/sorting-pipe';
import { PaginationPipe } from '../pipes/pagination-pipe';

export const FilterQuery = (data: Type): ParameterDecorator => Query(new FilteringPipe(data));
export const SortQuery = (data: Type): ParameterDecorator => Query(new SortingPipe(data));
export const PaginationQuery = (): ParameterDecorator => Query(new PaginationPipe());
