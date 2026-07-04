import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

const EXCHANGE = 'aivacol.fleet';

@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingService.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private readonly url: string;

  constructor(private readonly config: ConfigService) {
    this.url = this.config.get<string>('RABBITMQ_URL') ?? '';
  }

  async onModuleInit() {
    if (!this.url) {
      this.logger.warn(
        'RABBITMQ_URL não configurada — mensageria desabilitada.',
      );
      return;
    }

    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });
      this.logger.log('Conectado ao RabbitMQ com sucesso.');
    } catch (err) {
      this.logger.warn(
        `Não foi possível conectar ao RabbitMQ (${(err as Error).message}). Aplicação seguirá sem mensageria.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  async publish(
    routingKey: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!this.channel) return;

    try {
      const message = {
        event: routingKey,
        payload,
        timestamp: new Date().toISOString(),
      };
      this.channel.publish(
        EXCHANGE,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { contentType: 'application/json', persistent: true },
      );
    } catch (err) {
      this.logger.error(
        `Falha ao publicar evento "${routingKey}": ${(err as Error).message}`,
      );
    }
  }
}
