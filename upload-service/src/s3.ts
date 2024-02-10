import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "fs";

export async function uploadFile(
  accessKey: string,
  secretAccessKey: string,
  region: string,
  bucket: string,
  localFilePath: string,
  fileName: string
) {
  console.log("Uploading file to bucket: " + bucket + " ...");
  try {
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey,
      },
    });

    // Read the file from local file system
    const fileStream = fs.createReadStream(localFilePath);

    // Upload the file to s3
    const uploadParams = {
      Bucket: bucket,
      Key: fileName,
      Body: fileStream,
    };

    const uploadCommand = new PutObjectCommand(uploadParams);
    const uploadResult = await s3Client.send(uploadCommand);
    console.log("File uploaded successfully: ", uploadResult);
  } catch (error) {
    console.error("Failed to upload file: " + localFilePath);
  }
}
