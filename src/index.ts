import express from "express";
import cors from "cors";
import uuid from "uuid";
import simpleGit from "simple-git";
import { getAllFiles } from "./file";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.post("/deploy", async (req, res) => {
  const { repoUrl } = req.body;
  if (repoUrl != null) {
    const id = uuid.v4();
    const outputPath = `output/${id}`;

    // Clone the repo at repoUrl and put it into outputPath
    await simpleGit().clone(repoUrl, path.join(__dirname, outputPath));

    // Upload the cloned repo to S3
    const files = await getAllFiles(path.join(__dirname, outputPath));

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
