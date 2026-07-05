import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let service: VehiclesService;

  const mockVehiclesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockVehicle = {
    license_plate: 'ABC1D23',
    model_id: '1',
    chassis: 'X',
    renavam: 'Y',
    year: 2026,
    id: '1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [{ provide: VehiclesService, useValue: mockVehiclesService }],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
    service = module.get<VehiclesService>(VehiclesService);
  });

  describe('findAll', () => {
    it('deve retornar um array de veículos', async () => {
      const list = [{ id: '1', license_plate: 'ABC1D23' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(list as Vehicle[]);

      const result = await controller.findAll();
      expect(result).toEqual(list);
      expect(mockVehiclesService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve retornar um veículo se encontrado', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockVehicle as Vehicle);

      const result = await controller.findOne('1');
      expect(result).toEqual(mockVehicle);
      expect(mockVehiclesService.findOne).toHaveBeenCalledWith('1');
      expect(mockVehiclesService.findOne).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('deve criar um novo veículo', async () => {
      const mockUser = { userId: '1', nickname: 'aivacol' };

      jest.spyOn(service, 'create').mockResolvedValue(mockVehicle as Vehicle);

      await controller.create(mockVehicle, mockUser);
      expect(mockVehiclesService.create).toHaveBeenCalledWith(
        mockVehicle,
        'aivacol',
      );
    });
  });

  describe('uodate', () => {
    it('deve fazer o update de um veículo', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockVehicle as Vehicle);
      jest
        .spyOn(service, 'update')
        .mockResolvedValue({ ...mockVehicle, year: 2025 } as Vehicle);
      const dto = { year: 2025 };

      const result = await controller.update('1', dto);
      expect(result).toEqual({
        ...mockVehicle,
        year: 2025,
      });
      expect(mockVehiclesService.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('deve remover o veículo', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockVehicle as Vehicle);
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);
      await controller.remove('1');

      expect(mockVehiclesService.remove).toHaveBeenCalled();
      expect(mockVehiclesService.remove).toHaveBeenCalledWith('1');
    });
  });
});
