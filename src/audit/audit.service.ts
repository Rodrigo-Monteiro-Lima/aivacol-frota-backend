import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Collection } from 'mongodb';

export interface AuditLogEntry {
  method: string;
  path: string;
  user: string | null;
  statusCode: number;
  durationMs: number;
  timestamp: Date;
}

@Injectable()
export class AuditService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditService.name);
  private client: MongoClient | null = null;
  private collection: Collection<AuditLogEntry> | null = null;
  private readonly url: string;

  constructor(private readonly config: ConfigService) {
    this.url = this.config.get<string>('MONGO_URL') ?? '';
  }

  async onModuleInit() {
    if (!this.url) {
      this.logger.warn('MONGO_URL não configurada');
      return;
    }

    try {
      this.client = new MongoClient(this.url);
      await this.client.connect();
      this.collection = this.client
        .db('aivacol_audit')
        .collection<AuditLogEntry>('audit_logs');
      await this.collection.createIndex({ timestamp: -1 });
      this.logger.log('Conectado ao MongoDB com sucesso.');
    } catch (err) {
      this.logger.warn(
        `Não foi possível conectar ao MongoDB (${(err as Error).message}.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.client?.close().catch(() => undefined);
  }

  async log(entry: AuditLogEntry): Promise<void> {
    if (!this.collection) return;

    try {
      await this.collection.insertOne(entry);
    } catch (err) {
      this.logger.error(
        `Falha ao gravar log de auditoria: ${(err as Error).message}`,
      );
    }
  }
}
