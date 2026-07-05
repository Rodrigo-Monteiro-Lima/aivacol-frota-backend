import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { Brand } from './entities/brand.entity';

describe('BrandsService', () => {
  let service: BrandsService;

  const mockBrandRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockBrand: Brand = {
    id: '1',
    name: 'Mercedes',
    models: [],
    created_at: new Date(),
    updated_at: new Date(),
    created_by: 'aivacol',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: getRepositoryToken(Brand), useValue: mockBrandRepo },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar e salvar uma nova brand', async () => {
      const dto = { name: 'Mercedes' };
      mockBrandRepo.create.mockReturnValue(mockBrand);
      mockBrandRepo.save.mockResolvedValue(mockBrand);

      const result = await service.create(dto, 'aivacol');

      expect(result).toEqual(mockBrand);
      expect(mockBrandRepo.create).toHaveBeenCalledWith({
        ...dto,
        created_by: 'aivacol',
      });
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as brands com seus models', async () => {
      mockBrandRepo.find.mockResolvedValue([mockBrand]);

      const result = await service.findAll();

      expect(result).toEqual([mockBrand]);
      expect(mockBrandRepo.find).toHaveBeenCalledWith({
        relations: { models: true },
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar a brand se encontrada', async () => {
      mockBrandRepo.findOne.mockResolvedValue(mockBrand);

      const result = await service.findOne('1');

      expect(result).toEqual(mockBrand);
    });

    it('deve lançar NotFoundException se a brand não existir', async () => {
      mockBrandRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('deve atualizar e salvar uma brand existente', async () => {
      const dto = { name: 'Mercedes-Benz' };
      mockBrandRepo.findOne.mockResolvedValue(mockBrand);
      mockBrandRepo.save.mockResolvedValue({ ...mockBrand, ...dto });

      const result = await service.update('1', dto);

      expect(result.name).toBe('Mercedes-Benz');
    });

    it('deve lançar NotFoundException ao atualizar brand inexistente', async () => {
      mockBrandRepo.findOne.mockResolvedValue(null);

      await expect(service.update('invalido', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
      expect(mockBrandRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve remover a brand com sucesso', async () => {
      mockBrandRepo.findOne.mockResolvedValue(mockBrand);
      mockBrandRepo.remove.mockResolvedValue(undefined);

      await service.remove('1');

      expect(mockBrandRepo.remove).toHaveBeenCalledWith(mockBrand);
    });

    it('deve lançar NotFoundException ao remover brand inexistente', async () => {
      mockBrandRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('invalido')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockBrandRepo.remove).not.toHaveBeenCalled();
    });
  });
});
