import * as dotenv from 'dotenv';
import * as amqp from 'amqplib';

dotenv.config();

const EXCHANGE = 'aivacol.fleet';
const QUEUE = 'vehicle-events-logger';

async function main() {
  const url = process.env.RABBITMQ_URL;
  if (!url) {
    console.error('RABBITMQ_URL não configurada.');
    process.exit(1);
  }

  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });

  await channel.bindQueue(QUEUE, EXCHANGE, 'vehicle.*');

  console.log(
    `Consumidor escutando eventos de "vehicle.*" na fila "${QUEUE}"...`,
  );

  channel.consume(QUEUE, (msg) => {
    if (!msg) return;

    const content = JSON.parse(msg.content.toString());
    console.log(
      `[${content.event}]`,
      content.payload,
      `em ${content.timestamp}`,
    );

    channel.ack(msg);
  });
}

main().catch((err) => {
  console.error('Erro no consumidor:', err);
  process.exit(1);
});
