import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { PrismaService } from '../prisma/prisma.service';

const mockService = {
  id: 'service-uuid-1',
  title: 'Hair Cut',
  description: 'A professional hair cutting service',
  duration: 60,
  price: 50.0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ServicesService', () => {
  let service: ServicesService;

  const mockPrismaService = {
    service: {
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
        ServicesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create a service successfully', async () => {
      mockPrismaService.service.create.mockResolvedValue(mockService);

      const result = await service.create({
        title: 'Hair Cut',
        description: 'A professional hair cutting service',
        duration: 60,
        price: 50.0,
      });

      expect(result.title).toBe('Hair Cut');
      expect(mockPrismaService.service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return paginated services', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockService], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a service by id', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      const result = await service.findOne('service-uuid-1');
      expect(result.id).toBe('service-uuid-1');
    });

    it('should throw NotFoundException when service does not exist', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a service successfully', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.service.update.mockResolvedValue({
        ...mockService,
        title: 'Hair Cut & Style',
      });

      const result = await service.update('service-uuid-1', {
        title: 'Hair Cut & Style',
      });

      expect(result.title).toBe('Hair Cut & Style');
    });
  });

  describe('remove', () => {
    it('should soft-delete (deactivate) a service', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.service.update.mockResolvedValue({
        ...mockService,
        isActive: false,
      });

      const result = await service.remove('service-uuid-1');
      expect(result.isActive).toBe(false);
    });
  });
});
