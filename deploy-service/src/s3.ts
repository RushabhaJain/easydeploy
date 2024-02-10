import {
  S3Client,
  ListObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const { ACCESS_KEY, SECRET_ACCESS_KEY, REGION } = process.env;

const s3Client = new S3Client({
  region: REGION || "",
  credentials: {
    accessKeyId: ACCESS_KEY || "",
    secretAccessKey: SECRET_ACCESS_KEY || "",
  },
});

export async function uploadFile(
  bucket: string,
  localFilePath: string,
  fileName: string
) {
  console.log("Uploading file to bucket: " + bucket + " ...");
  try {
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

async function listObjectsInFolder(bucket: string, folderPath: string) {
  const params = {
    Bucket: bucket,
    Prefix: folderPath,
  };

  const listObjectCommand = new ListObjectsCommand(params);
  const response = await s3Client.send(listObjectCommand);
  return response.Contents?.map((object) => object.Key);
}

export async function downloadObjectInFolder(
  bucket: string,
  localPath: string,
  key: string
) {
  try {
    const params = {
      Bucket: bucket,
      Key: key,
    };
    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);
    const finalOutputPath = path.join(localPath, key);
    if (response.Body) {
      const dirName = path.dirname(finalOutputPath);
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
      }
      // @ts-ignore
      await response.Body.pipe(fs.createWriteStream(finalOutputPath));
    }
  } catch (error) {
    console.error("Error downloading object:", error); // Log any errors
    throw error; // Re-throw the error for further handling
  }
}

// Function to download a folder from S3
export async function downloadS3Folder(
  bucket: string,
  id: string,
  localPath: string
) {
  const objects = await listObjectsInFolder(bucket, id);
  if (objects && objects.length > 0) {
    for (const objectKey of objects) {
      if (objectKey) {
        const localFilePath = path.join(localPath, objectKey);
        await downloadObjectInFolder(bucket, localPath, objectKey || "");
        console.log(`Downloaded ${objectKey} to ${localFilePath}`);
      }
    }
  }
}
