import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ModelsService } from './models.service';
import { Model } from './entities/model.entity';

describe('ModelsService', () => {
  let service: ModelsService;
  let repository: Repository<Model>;

  const mockModelRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelsService,
        {
          provide: getRepositoryToken(Model),
          useValue: mockModelRepository,
        },
      ],
    }).compile();

    service = module.get<ModelsService>(ModelsService);
    repository = module.get<Repository<Model>>(getRepositoryToken(Model));
  });

  afterEach(() => jest.clearAllMocks());

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('deve retornar um model se encontrado', async () => {
      const mockModel = { id: 'uuid-1', name: 'Sedan' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockModel as Model);

      const result = await service.findOne('uuid-1');
      expect(result).toEqual(mockModel);
      expect(mockModelRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });

    it('deve lançar NotFoundException se o model não existir', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('uuid-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('deve criar e salvar um novo model', async () => {
      const dto = { name: 'SUV' };
      const savedModel = { id: 'uuid-2', name: 'SUV', created_by: 'aivacol' };

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
  });

  describe('remove', () => {
    it('deve remover model', async () => {
      const mockModel = { id: 'uuid-1', name: 'Sedan' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockModel as Model);
      jest.spyOn(repository, 'remove').mockResolvedValue(mockModel as Model);

      await service.remove('model-uuid-1');

      expect(mockModelRepository.remove).toHaveBeenCalledWith(mockModel);
    });
  });
});
