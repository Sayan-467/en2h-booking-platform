import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @ApiProperty({ example: 'Hair Cut', description: 'Title of the service' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiProperty({ example: 'A professional hair cut service' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ example: 60, description: 'Duration of service in minutes' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  duration: number;

  @ApiProperty({ example: 50.00, description: 'Price of the service' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateServiceDto {
  @ApiPropertyOptional({ example: 'Hair Cut & Style' })
  @IsString()
  @MinLength(2)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'A professional hair cut and styling service' })
  @IsString()
  @MinLength(10)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 90 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  duration?: number;

  @ApiPropertyOptional({ example: 75.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ServiceQueryDto {
  @ApiPropertyOptional({ description: 'Filter by active status', example: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Page number (1-indexed)', example: 1, default: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, default: 10 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
