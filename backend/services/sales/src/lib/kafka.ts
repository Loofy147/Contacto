import { Kafka } from 'kafkajs';
import { config } from '../config';

const kafkaInstance = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
});

const producer = kafkaInstance.producer();
export const consumer = kafkaInstance.consumer({ groupId: config.kafka.groupId });

export const connectKafka = async () => {
  await producer.connect();
  await consumer.connect();
};

export const disconnectKafka = async () => {
  await producer.disconnect();
  await consumer.disconnect();
};

export const kafka = {
  send: (payload: any) => producer.send(payload),
  connect: () => producer.connect(),
  disconnect: () => producer.disconnect(),
  subscribe: (options: any) => consumer.subscribe(options),
  run: (options: any) => consumer.run(options),
};
