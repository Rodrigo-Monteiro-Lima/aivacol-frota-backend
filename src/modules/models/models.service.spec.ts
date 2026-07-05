import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ModelsService } from './models.service';
import { Model } from './entities/model.entity';
import { Brand } from '../brands/entities/brand.entity';

describe('ModelsService', () => {
  let service: ModelsService;
  let repository: Repository<Model>;

  const mockModelRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockBrandRepo = {
    findOne: jest.fn(),
  };

  const dto = { name: 'SUV', brand_id: '1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelsService,
        {
          provide: getRepositoryToken(Model),
          useValue: mockModelRepository,
        },
        { provide: getRepositoryToken(Brand), useValue: mockBrandRepo },
      ],
    }).compile();

    service = module.get<ModelsService>(ModelsService);
    repository = module.get<Repository<Model>>(getRepositoryToken(Model));
  });

  afterEach(() => jest.clearAllMocks());

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });
  describe('findAll', () => {
    it('deve retornar um array de models', async () => {
      const mockModel = [{ id: '1', name: 'Hatch' }];
      jest.spyOn(repository, 'find').mockResolvedValue(mockModel as Model[]);

      const result = await service.findAll();
      expect(result).toEqual(mockModel);
      expect(mockModelRepository.find).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('deve retornar um model se encontrado', async () => {
      const mockModel = { id: '1', name: 'Sedan' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockModel as Model);

      const result = await service.findOne('1');
      expect(result).toEqual(mockModel);
      expect(mockModelRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('deve lançar NotFoundException se o model não existir', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('deve criar e salvar um novo model', async () => {
      const savedModel = { id: '2', name: 'SUV', created_by: 'aivacol' };
      mockBrandRepo.findOne.mockResolvedValue({ id: '1' });
      mockModelRepository.create.mockReturnValue(savedModel);
      mockModelRepository.save.mockResolvedValue(savedModel);

      const result = await service.create(dto, 'aivacol');
      expect(result).toEqual(savedModel);
      expect(mockModelRepository.create).toHaveBeenCalledWith({
        ...dto,
        created_by: 'aivacol',
      });
      expect(mockModelRepository.save).toHaveBeenCalledWith(savedModel);
    });

    it('deve lançar NotFoundException se o brand_id não existir', async () => {
      mockBrandRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 'aivacol')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockModelRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve remover model sem veículos vinculados', async () => {
      const mockModel = { id: '1', name: 'Sedan' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockModel as Model);
      jest.spyOn(repository, 'remove').mockResolvedValue(mockModel as Model);

      const qbMock = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(qbMock as any);

      await service.remove('1');
      expect(mockModelRepository.remove).toHaveBeenCalledWith(mockModel);
    });

    it('deve impedir remoção de model com veículos vinculados', async () => {
      const mockModel = { id: '1', name: 'Sedan' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockModel as Model);

      const qbMock = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(qbMock as any);

      await expect(service.remove('1')).rejects.toThrow(ConflictException);
      expect(mockModelRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deve atualizar e salvar um model existente', async () => {
      const mockModel = { id: '1', name: 'Sedan' };
      const dto = { name: 'Sedan Atualizado' };
      const updatedModel = { ...mockModel, ...dto };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockModel as Model);
      mockModelRepository.save.mockResolvedValue(updatedModel);

      const result = await service.update('1', dto);

      expect(result).toEqual(updatedModel);
      expect(mockModelRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(dto),
      );
    });

    it('deve lançar NotFoundException se tentar atualizar model inexistente', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(
        service.update('uuid-invalido', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockModelRepository.save).not.toHaveBeenCalled();
    });
  });
});
