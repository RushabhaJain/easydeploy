import express from "express";
import dotenv from "dotenv";
import { generateUniqueProjectId } from "./project";
import { scheduleDeployment } from "./deployment";
dotenv.config();

const app = express();
app.use(express.json());

app.post("/deploy", async (req, res) => {
  let { gitUrl, projectId } = req.body;
  if (gitUrl && gitUrl.trim().length > 0) {
    // Start the deployment
    if (!projectId) {
      projectId = generateUniqueProjectId();
      try {
        await scheduleDeployment(gitUrl, projectId);
        res.status(200).send({
          projectId,
        });
      } catch (error) {
        res.status(500).send({
          message: "Unable to deploy project, please try again after some time",
        });
      }
    }
  } else {
    res.status(400).send({
      message: "Please send repoUrl pointing to your github repository",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("API Server started on port " + PORT);
});
