import { Kafka } from "kafkajs";
import dotenv from "dotenv";
dotenv.config();

const {
  KAFKA_BOOTSTRAP_SERVER,
  KAFKA_SASL_USERNAME,
  KAFKA_SASL_PASSWORD,
  KAFKA_CLIENT_ID,
  KAFKA_TOPIC,
} = process.env;

const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID || "",
  brokers: [KAFKA_BOOTSTRAP_SERVER || ""],
  ssl: true,
  sasl: {
    username: KAFKA_SASL_USERNAME || "",
    password: KAFKA_SASL_PASSWORD || "",
    mechanism: "plain",
  },
});

const producer = kafka.producer();

export const publish = async (content: any) => {
  await producer.connect();
  await producer.send({
    topic: KAFKA_TOPIC || "",
    messages: [content],
  });
  await producer.disconnect();
};
