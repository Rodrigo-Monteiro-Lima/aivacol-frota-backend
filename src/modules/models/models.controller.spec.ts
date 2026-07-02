import { Test, TestingModule } from '@nestjs/testing';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';

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
      jest.spyOn(service, 'findAll').mockResolvedValue(expectedResult as any);

      const result = await controller.findAll();
      expect(result).toEqual(expectedResult);
      expect(mockModelsService.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('deve chamar o service passando o dto e o criador padrão', async () => {
      const dto = { name: 'Caminhão' };
      jest
        .spyOn(service, 'create')
        .mockResolvedValue({ id: '1', ...dto } as any);

      await controller.create(dto);
      expect(mockModelsService.create).toHaveBeenCalledWith(dto, 'aivacol');
    });
  });
});
