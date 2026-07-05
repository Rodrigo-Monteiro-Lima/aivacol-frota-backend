import { Test, TestingModule } from '@nestjs/testing';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { Brand } from './entities/brand.entity';

describe('BrandsController', () => {
  let controller: BrandsController;
  let service: BrandsService;

  const mockBrand = { id: '1', name: 'Volkswagen' };

  const mockBrandsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandsController],
      providers: [{ provide: BrandsService, useValue: mockBrandsService }],
    }).compile();

    controller = module.get<BrandsController>(BrandsController);
    service = module.get<BrandsService>(BrandsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('deve retornar um array de marcas', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([mockBrand] as Brand[]);

      const result = await controller.findAll();
      expect(result).toEqual([mockBrand]);
      expect(mockBrandsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve retornar uma marca se encontrado', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockBrand as Brand);

      const result = await controller.findOne('1');
      expect(result).toEqual(mockBrand);
      expect(mockBrandsService.findOne).toHaveBeenCalledWith('1');
      expect(mockBrandsService.findOne).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('deve criar uma nova marca', async () => {
      const mockUser = { userId: '1', nickname: 'aivacol' };

      jest.spyOn(service, 'create').mockResolvedValue(mockBrand as Brand);

      await controller.create(mockBrand, mockUser);
      expect(mockBrandsService.create).toHaveBeenCalledWith(
        mockBrand,
        'aivacol',
      );
    });
  });

  describe('uodate', () => {
    it('deve fazer o update de uma marca', async () => {
      const dto = { name: 'BMW' };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockBrand as Brand);
      jest
        .spyOn(service, 'update')
        .mockResolvedValue({ ...mockBrand, ...dto } as Brand);

      const result = await controller.update('1', dto);
      expect(result).toEqual({
        ...mockBrand,
        ...dto,
      });
      expect(mockBrandsService.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('deve remover uma marca', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockBrand as Brand);
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);
      await controller.remove('1');

      expect(mockBrandsService.remove).toHaveBeenCalled();
      expect(mockBrandsService.remove).toHaveBeenCalledWith('1');
    });
  });
});
