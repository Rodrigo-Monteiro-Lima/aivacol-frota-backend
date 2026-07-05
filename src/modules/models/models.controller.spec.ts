import { Test, TestingModule } from '@nestjs/testing';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';
import { Model } from './entities/model.entity';

describe('ModelsController', () => {
  let controller: ModelsController;
  let service: ModelsService;

  const mockModelsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModelsController],
      providers: [
        {
          provide: ModelsService,
          useValue: mockModelsService,
        },
      ],
    }).compile();

    controller = module.get<ModelsController>(ModelsController);
    service = module.get<ModelsService>(ModelsService);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('deve retornar um array de models', async () => {
      const expectedResult = [{ id: '1', name: 'Hatch' }];
      jest
        .spyOn(service, 'findAll')
        .mockResolvedValue(expectedResult as Model[]);

      const result = await controller.findAll();
      expect(result).toEqual(expectedResult);
      expect(mockModelsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve retornar um model se encontrado', async () => {
      const expectedResult = { id: '1', name: 'Hatch' };
      jest.spyOn(service, 'findOne').mockResolvedValue(expectedResult as Model);

      const result = await controller.findOne('1');
      expect(result).toEqual(expectedResult);
      expect(mockModelsService.findOne).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('deve chamar o service passando o dto e o criador padrão', async () => {
      const dto = { name: 'Caminhão', brand_id: '1' };
      const mockUser = { userId: '1', nickname: 'aivacol' };

      jest
        .spyOn(service, 'create')
        .mockResolvedValue({ id: '1', ...dto } as any);

      await controller.create(dto, mockUser);
      expect(mockModelsService.create).toHaveBeenCalledWith(dto, 'aivacol');
    });
  });

  describe('uodate', () => {
    it('deve fazer o update de um modelo', async () => {
      const expectedResult = { id: '1', name: 'Hatch' };
      jest.spyOn(service, 'findOne').mockResolvedValue(expectedResult as Model);
      jest
        .spyOn(service, 'update')
        .mockResolvedValue({ ...expectedResult, name: 'Ferrari' } as Model);
      const dto = { name: 'Ferrari' };

      const result = await controller.update('1', dto);
      expect(result).toEqual({
        ...expectedResult,
        name: 'Ferrari',
      });
      expect(mockModelsService.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('deve remover o veículo', async () => {
      const expectedResult = { id: '1', name: 'Hatch' };
      jest.spyOn(service, 'findOne').mockResolvedValue(expectedResult as Model);
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);
      await controller.remove('1');

      expect(mockModelsService.remove).toHaveBeenCalled();
      expect(mockModelsService.remove).toHaveBeenCalledWith('1');
    });
  });
});
