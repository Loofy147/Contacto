"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kafka = void 0;
// backend/services/identity/src/lib/kafka.ts
const kafkajs_1 = require("kafkajs");
const config_1 = require("../config");
exports.kafka = new kafkajs_1.Kafka({
    clientId: config_1.config.kafka.clientId,
    brokers: config_1.config.kafka.brokers,
});
