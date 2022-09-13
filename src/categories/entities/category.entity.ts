import { Category as PrismaCategory } from '@prisma/client';
import { IsInt, IsString } from 'class-validator';

export class Category implements PrismaCategory {
  @IsInt()
  id: number;
  /**
   * Category label
   */

  @IsString()
  label: string;

  /**
   * Id of category owner
   */
  @IsInt()
  userId: number;

  constructor(id: number, label: string, userId: number) {
    this.id = id;
    this.label = label;
    this.userId = userId;
  }
}
