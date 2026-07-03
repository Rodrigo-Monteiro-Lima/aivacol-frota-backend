import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import { Model } from '../models/entities/model.entity';

describe('VehiclesService', () => {
  let service: VehiclesService;

  const mockVehicleRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockModelRepo = {
    findOne: jest.fn(),
  };

  const createDto = {
    license_plate: 'ABC1D23',
    chassis: '9BWZZZ377VT004251',
    renavam: '12345678901',
    year: 2022,
    model_id: '1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: getRepositoryToken(Vehicle), useValue: mockVehicleRepo },
        { provide: getRepositoryToken(Model), useValue: mockModelRepo },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve lançar NotFoundException se o model_id não existir', async () => {
      mockModelRepo.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, 'aivacol')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockVehicleRepo.save).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException se a placa já existir', async () => {
      mockModelRepo.findOne.mockResolvedValue({ id: '1' });

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: '2' }),
      };
      mockVehicleRepo.createQueryBuilder.mockReturnValue(qbMock);

      await expect(service.create(createDto, 'aivacol')).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve criar o veículo quando model existe e não há duplicidade', async () => {
      mockModelRepo.findOne.mockResolvedValue({ id: '1' });

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockVehicleRepo.createQueryBuilder.mockReturnValue(qbMock);
      mockVehicleRepo.create.mockReturnValue({ id: '1', ...createDto });
      mockVehicleRepo.save.mockResolvedValue({ id: '1', ...createDto });

      const result = await service.create(createDto, 'aivacol');

      expect(result).toEqual({ id: '1', ...createDto });
      expect(mockVehicleRepo.save).toHaveBeenCalled();
    });
  });
  describe('findAll', () => {
    it('deve retornar uma lista de veículos com seus modelos', async () => {
      const mockVehicles = [{ id: '1', license_plate: 'ABC1D23' }];
      mockVehicleRepo.find.mockResolvedValue(mockVehicles);

      const result = await service.findAll();

      expect(result).toEqual(mockVehicles);
      expect(mockVehicleRepo.find).toHaveBeenCalledWith({
        relations: { model: true },
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar um veículo se encontrado', async () => {
      const mockVehicle = { id: '1', license_plate: 'ABC1D23' };
      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);

      const result = await service.findOne('1');

      expect(result).toEqual(mockVehicle);
      expect(mockVehicleRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: { model: true },
      });
    });

    it('deve lançar NotFoundException se o veículo não existir', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const existingVehicle = {
      id: '1',
      license_plate: 'OLD1234',
      chassis: 'CHASSIS12345678',
      renavam: '11111111111',
      model_id: '1',
    };

    it('deve atualizar o veículo com sucesso se os dados únicos forem válidos', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(existingVehicle);
      mockModelRepo.findOne.mockResolvedValue({ id: '1' });
      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockVehicleRepo.createQueryBuilder.mockReturnValue(qbMock);
      mockVehicleRepo.save.mockImplementation((v) => Promise.resolve(v));

      const updateDto = {
        license_plate: 'AVD1234',
        model_id: '1',
      };

      const result = await service.update('1', updateDto);

      expect(result.license_plate).toBe('AVD1234');
      expect(result.model_id).toBe('1');
      expect(mockVehicleRepo.save).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se o novo model_id fornecido não existir', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(existingVehicle);
      mockModelRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('1', { model_id: 'invalido' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException se tentar alterar chassi para um que já existe', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(existingVehicle);

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: '1' }),
      };
      mockVehicleRepo.createQueryBuilder.mockReturnValue(qbMock);

      await expect(
        service.update('1', { chassis: 'CHASSI_JA_EXISTENTE' }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve passar pelas validações quando chassi e renavam forem alterados', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(existingVehicle);
      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockVehicleRepo.createQueryBuilder.mockReturnValue(qbMock);
      mockVehicleRepo.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.update('1', {
        chassis: 'NOVO12345678',
        renavam: '22222222222',
      });

      expect(result.chassis).toBe('NOVO12345678');
      expect(result.renavam).toBe('22222222222');
    });
  });

  describe('remove', () => {
    it('deve remover o veículo com sucesso', async () => {
      const mockVehicle = { id: '1', license_plate: 'ABC1D23' };
      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);
      mockVehicleRepo.remove.mockResolvedValue(undefined);

      await service.remove('1');

      expect(mockVehicleRepo.remove).toHaveBeenCalledWith(mockVehicle);
    });
  });
});
