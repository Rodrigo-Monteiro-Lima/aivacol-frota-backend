import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService {
  private readonly defaultTtl: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly client: Redis,
    private readonly config: ConfigService,
  ) {
    this.defaultTtl = this.config.get<number>('CACHE_TTL_SECONDS') ?? 300;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.client.set(
      key,
      JSON.stringify(value),
      'EX',
      ttlSeconds ?? this.defaultTtl,
    );
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
