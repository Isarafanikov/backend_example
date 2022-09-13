import { OmitType } from '@nestjs/swagger';
import { Category } from '../entities/category.entity';
import { IsInt, IsOptional } from 'class-validator';

export class CreateCategoryDto extends OmitType(Category, ['id', 'userId'] as const) {
  /**
   * Id of category owner
   */
  @IsOptional()
  @IsInt()
  userId?: number;
}
