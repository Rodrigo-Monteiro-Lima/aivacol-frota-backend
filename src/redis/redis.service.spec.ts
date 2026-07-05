import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import { REDIS_CLIENT } from './redis.constants';

describe('RedisService', () => {
  let service: RedisService;

  const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: REDIS_CLIENT, useValue: mockRedisClient },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  describe('get', () => {
    it('deve retornar o valor desserializado quando existe no cache', async () => {
      mockRedisClient.get.mockResolvedValue(JSON.stringify({ id: '1' }));

      const result = await service.get<{ name: string }>('vehicles:1');

      expect(result).toEqual({ id: '1' });
      expect(mockRedisClient.get).toHaveBeenCalledWith('vehicles:1');
    });

    it('deve retornar null quando a chave não existe no cache', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('inexistente');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('deve serializar o valor e usar o TTL informado', async () => {
      await service.set('vehicles:all', [{ id: '1' }], 120);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'vehicles:all',
        JSON.stringify([{ id: '1' }]),
        'EX',
        120,
      );
    });

    it('deve usar o TTL padrão (CACHE_TTL_SECONDS) quando nenhum for informado', async () => {
      mockConfigService.get.mockReturnValue(300);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RedisService,
          { provide: REDIS_CLIENT, useValue: mockRedisClient },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();
      const serviceWithTtl = module.get<RedisService>(RedisService);

      await serviceWithTtl.set('vehicles:all', [{ id: '1' }]);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'vehicles:all',
        JSON.stringify([{ id: '1' }]),
        'EX',
        300,
      );
    });
  });

  describe('del', () => {
    it('deve chamar o del do cliente com a chave informada', async () => {
      await service.del('vehicles:id:1');

      expect(mockRedisClient.del).toHaveBeenCalledWith('vehicles:id:1');
    });
  });
});
