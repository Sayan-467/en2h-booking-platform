import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { BookingStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty({ example: 'John Doe', description: 'Customer full name' })
  @IsString()
  @MinLength(2)
  customerName: string;

  @ApiProperty({ example: 'john@example.com', description: 'Customer email address' })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ example: '+1-555-555-5555', description: 'Customer phone number' })
  @IsString()
  @MinLength(5)
  customerPhone: string;

  @ApiProperty({ example: 'uuid-of-service', description: 'ID of the service to book' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ example: '2026-08-15', description: 'Date of the booking (YYYY-MM-DD, must be today or future)' })
  @IsDateString()
  bookingDate: string;

  @ApiProperty({ example: '14:30', description: 'Time of the booking in 24-hour HH:MM format' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'bookingTime must be in HH:MM 24-hour format (e.g., "14:30")',
  })
  bookingTime: string;

  @ApiPropertyOptional({ example: 'Please prepare a specific style', description: 'Optional notes for the booking' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
    description: 'New status for the booking',
  })
  @IsEnum(BookingStatus)
  status: BookingStatus;
}

export class BookingQueryDto {
  @ApiPropertyOptional({ enum: BookingStatus, description: 'Filter bookings by status' })
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Search by customer name or email' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by service ID' })
  @IsUUID()
  @IsOptional()
  serviceId?: string;

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
