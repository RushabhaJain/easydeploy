import express from "express";
import cors from "cors";
import { v4 } from "uuid";
import simpleGit from "simple-git";
import { deleteFolder, getAllFiles } from "./file";
import path from "path";
import dotenv from "dotenv";
import { uploadFile } from "./s3";
import { publish } from "./messageQueue";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.post("/deploy", async (req, res) => {
  const { repoUrl } = req.body;
  if (repoUrl != null) {
    const id = v4();
    const outputPath = `output/${id}`;

    // Clone the repo at repoUrl and put it into outputPath
    await simpleGit().clone(repoUrl, path.join(__dirname, outputPath));

    // Upload the cloned repo to S3
    const files = await getAllFiles(path.join(__dirname, outputPath));

    const { ACCESS_KEY, SECRET_ACCESS_KEY, BUCKET_NAME, REGION } = process.env;

    const fileUploadPromises = files.map(async (file) => {
      await uploadFile(
        ACCESS_KEY as string,
        SECRET_ACCESS_KEY as string,
        REGION as string,
        BUCKET_NAME as string,
        file,
        file.slice(path.join(__dirname, "output").length + 1)
      );
    });

    await Promise.all(fileUploadPromises);

    console.log("Files successfully uploaded to s3");

    // Add the message to queue
    await publish({
      value: id,
    });

    console.log("Message successfuly published to queue");

    deleteFolder(path.join(__dirname, outputPath));

    res.json({
      id,
    });
  } else {
    res.status(400).send({
      status: "false",
      message: "Please provide valid repoUrl",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Application started on port: ${PORT}`);
});
