import { Kafka } from "kafkajs";
import dotenv from "dotenv";
import path from "path";
import { downloadS3Folder, uploadFile } from "./s3";
import { buildCode } from "./build";
import { deleteFolder, getAllFiles } from "./file";
dotenv.config();

const {
  KAFKA_BOOTSTRAP_SERVER,
  KAFKA_SASL_USERNAME,
  KAFKA_SASL_PASSWORD,
  KAFKA_CLIENT_ID,
  KAFKA_TOPIC,
  KAFKA_SESSION_TIMEOUT_MS,
  UPLOAD_BUCKET_NAME,
  DOWNLOAD_BUCKET_NAME,
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
  connectionTimeout: KAFKA_SESSION_TIMEOUT_MS
    ? parseInt(KAFKA_SESSION_TIMEOUT_MS)
    : 5000,
});

(async () => {
  const consumer = kafka.consumer({ groupId: "deploy-service" });

  await consumer.connect();
  console.log("consumer connected successfully!");
  await consumer.subscribe({ topic: KAFKA_TOPIC || "", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(message.value?.toString());
      const id = message.value?.toString();
      if (id) {
        const localPath = path.join(__dirname, "downloads");

        // 1. Download REACT code
        await downloadS3Folder(DOWNLOAD_BUCKET_NAME || "", id, localPath);
        console.log("Successfully downloaded code from S3!");

        // 2. Build the REACT code
        await buildCode(path.join(localPath, id));
        console.log("Successfully build the code");

        // 3. Upload the artifacts to S3
        const files = await getAllFiles(path.join(localPath, id, "dist"));

        const fileUploadPromises = files.map(async (file) => {
          await uploadFile(
            UPLOAD_BUCKET_NAME || "",
            file,
            file.slice(localPath.length + 1)
          );
        });

        await Promise.all(fileUploadPromises);
        console.log("Build files successfully uploaded to S3");

        await deleteFolder(path.join(localPath, id));
      }
    },
  });
})();
