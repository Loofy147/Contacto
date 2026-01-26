// backend/services/identity/src/lib/kafka.ts
import { Kafka } from 'kafkajs';
import { config } from '../config';

export const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
});
