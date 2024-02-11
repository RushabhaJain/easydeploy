const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const dotenv = require("dotenv");
dotenv.config();

const s3Client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const PROJECT_ID = process.env.PROJECT_ID;

function getAllFiles(folderPath) {
  let response = [];

  const allFilesAndFolders = fs.readdirSync(folderPath);
  allFilesAndFolders.forEach((file) => {
    const fullFilePath = path.join(folderPath, file);
    if (fs.statSync(fullFilePath).isDirectory()) {
      response = response.concat(getAllFiles(fullFilePath));
    } else {
      response.push(fullFilePath);
    }
  });
  return response;
}

async function init() {
  console.log("Building the project...");
  const outDirPath = path.join(__dirname, "output");
  const p = exec(`cd ${outDirPath} && npm install && npm run build`);
  p.stdout.on("data", function (data) {
    console.log(data.toString());
  });

  p.stdout.on("error", function (data) {
    console.log("Error", data.toString());
  });

  p.on("close", async () => {
    console.log("Build completed!");
    console.log("Uploading files to S3...");
    // Get all the files to upload to S3
    const artifactPath = path.join(outDirPath, "dist");
    const files = getAllFiles(artifactPath);
    for (let file of files) {
      // Upload the file
      const command = new PutObjectCommand({
        Bucket: process.env.UPLOAD_BUCKET_NAME,
        Key: `${PROJECT_ID}/${file.slice(artifactPath.length + 1)}`,
        Body: fs.createReadStream(file),
        ContentType: mime.lookup(file),
      });
      await s3Client.send(command);
    }
    console.log("Upload process completed!");
    console.log("App successfully deployed!");
  });
}

init();
