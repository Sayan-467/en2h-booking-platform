import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];

const mockServiceEntity = {
  id: 'service-uuid-1',
  title: 'Hair Cut',
  description: 'A professional hair cutting service',
  duration: 60,
  price: 50.0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBooking = {
  id: 'booking-uuid-1',
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  customerPhone: '+1234567890',
  serviceId: 'service-uuid-1',
  bookingDate: new Date(tomorrowStr),
  bookingTime: '14:00',
  status: BookingStatus.PENDING,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  service: mockServiceEntity,
};

describe('BookingsService', () => {
  let service: BookingsService;

  const mockPrismaService = {
    service: {
      findUnique: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const createDto = {
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      customerPhone: '+1234567890',
      serviceId: 'service-uuid-1',
      bookingDate: tomorrowStr,
      bookingTime: '14:00',
    };

    it('should create a booking successfully', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceEntity);
      mockPrismaService.booking.create.mockResolvedValue(mockBooking);

      const result = await service.create(createDto);
      expect(result.id).toBe('booking-uuid-1');
      expect(result.customerEmail).toBe('jane@example.com');
    });

    it('should throw BadRequestException for a past booking date', async () => {
      await expect(
        service.create({ ...createDto, bookingDate: yesterdayStr }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create({ ...createDto, bookingDate: yesterdayStr }),
      ).rejects.toThrow('Booking date cannot be in the past');
    });

    it('should throw NotFoundException when service does not exist', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when service is inactive', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue({
        ...mockServiceEntity,
        isActive: false,
      });

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(
        service.create(createDto),
      ).rejects.toThrow('not currently active');
    });

    it('should throw ConflictException on duplicate booking (Prisma P2002)', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceEntity);
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0', meta: {} },
      );
      mockPrismaService.booking.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow(
        'already booked at the selected date and time',
      );
    });
  });

  describe('updateStatus', () => {
    it('should throw BadRequestException when updating a CANCELLED booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      await expect(
        service.updateStatus('booking-uuid-1', { status: BookingStatus.CONFIRMED }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus('booking-uuid-1', { status: BookingStatus.CONFIRMED }),
      ).rejects.toThrow('Cancelled bookings cannot have their status changed');
    });

    it('should throw BadRequestException when cancelling a COMPLETED booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.COMPLETED,
      });

      await expect(
        service.updateStatus('booking-uuid-1', { status: BookingStatus.CANCELLED }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus('booking-uuid-1', { status: BookingStatus.CANCELLED }),
      ).rejects.toThrow('Completed bookings cannot be cancelled');
    });

    it('should update status from PENDING to CONFIRMED', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      const result = await service.updateStatus('booking-uuid-1', {
        status: BookingStatus.CONFIRMED,
      });
      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });
  });

  describe('cancel', () => {
    it('should cancel a PENDING booking successfully', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancel('booking-uuid-1');
      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw BadRequestException if already cancelled', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      await expect(service.cancel('booking-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when booking does not exist', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
