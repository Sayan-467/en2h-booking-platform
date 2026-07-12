import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BookingQueryDto,
  CreateBookingDto,
  UpdateBookingStatusDto,
} from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookingDto) {
    // BUSINESS RULE 1: Booking date cannot be in the past
    const bookingDate = new Date(dto.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for date-only comparison

    if (bookingDate < today) {
      throw new BadRequestException('Booking date cannot be in the past');
    }

    // BUSINESS RULE 2: Service must exist and be active
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with id "${dto.serviceId}" not found`);
    }

    if (!service.isActive) {
      throw new BadRequestException(
        `Service "${service.title}" is not currently active and cannot be booked`,
      );
    }

    // BUSINESS RULE 3: Prevent duplicate bookings for same service/date/time
    try {
      const booking = await this.prisma.booking.create({
        data: {
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          serviceId: dto.serviceId,
          bookingDate: new Date(dto.bookingDate),
          bookingTime: dto.bookingTime,
          notes: dto.notes,
          status: BookingStatus.PENDING,
        },
        include: {
          service: {
            select: { id: true, title: true, duration: true, price: true },
          },
        },
      });

      return booking;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This service is already booked at the selected date and time. Please choose a different time slot.',
        );
      }
      throw error;
    }
  }

  async findAll(query: BookingQueryDto) {
    const { page = 1, limit = 10, status, search, serviceId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ bookingDate: 'asc' }, { bookingTime: 'asc' }],
        include: {
          service: {
            select: { id: true, title: true, duration: true, price: true },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            price: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with id "${id}" not found`);
    }

    return booking;
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto) {
    const booking = await this.findOne(id);

    // BUSINESS RULE 4: Cancelled bookings cannot be set to other statuses
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException(
        'Cancelled bookings cannot have their status changed',
      );
    }

    // BUSINESS RULE 5: Completed bookings cannot be cancelled
    if (
      booking.status === BookingStatus.COMPLETED &&
      dto.status === BookingStatus.CANCELLED
    ) {
      throw new BadRequestException('Completed bookings cannot be cancelled');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: dto.status },
      include: {
        service: {
          select: { id: true, title: true, duration: true, price: true },
        },
      },
    });
  }

  async cancel(id: string) {
    const booking = await this.findOne(id);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Completed bookings cannot be cancelled');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
      include: {
        service: {
          select: { id: true, title: true, duration: true, price: true },
        },
      },
    });
  }
}
