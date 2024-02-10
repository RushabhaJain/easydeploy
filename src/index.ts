import express from "express";
import cors from "cors";
import uuid from "uuid";
import simpleGit from "simple-git";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/deploy", async (req, res) => {
  const { repoUrl } = req.body;
  if (repoUrl != null) {
    const id = uuid.v4();
    const outputPath = `output/${id}`;

    // Clone the repo at repoUrl and put it into outputPath
    await simpleGit().clone(repoUrl, outputPath);

    console.log(repoUrl);
    res.json({});
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
