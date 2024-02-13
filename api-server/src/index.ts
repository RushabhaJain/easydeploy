import express from "express";
import dotenv from "dotenv";
import { generateUniqueProjectId } from "./project";
import { scheduleDeployment } from "./deployment";
import { Redis } from "ioredis";
import { Server } from "socket.io";
dotenv.config();

const { REDIS_URL, SOCKET_PORT } = process.env;
let subscriber: Redis;
let socketServer: Server;

if (REDIS_URL) {
  subscriber = new Redis(REDIS_URL);
  socketServer = new Server({
    cors: {
      origin: "*",
    },
  });

  // Start socket server
  const socketPort = SOCKET_PORT ? parseInt(SOCKET_PORT) : 9002;
  socketServer.listen(socketPort);

  socketServer.on("connection", (socket) => {
    socket.on("subscribe", (channel) => {
      // Join the room
      socket.join(channel);
      socket.emit("message", `Joined ${channel}`);
    });
  });

  async function initRedisSubscribe() {
    console.log("Subscribed to logs");
    subscriber.psubscribe("logs:*");
    subscriber.on("pmessage", (pattern, channel, message) => {
      // Emit "message" event to all the sockets joined the channel
      console.log(`Received message on channel ${channel}: ${message}`);
      socketServer.to(channel).emit("message", message);
    });
  }

  initRedisSubscribe();
}

const app = express();
app.use(express.json());

app.post("/deploy", async (req, res) => {
  let { gitUrl, projectId } = req.body;
  if (gitUrl && gitUrl.trim().length > 0) {
    // Start the deployment
    projectId = projectId || generateUniqueProjectId();
    try {
      await scheduleDeployment(gitUrl, projectId);
      res.status(200).send({
        status: "Queued",
        projectId,
        projectUrl: `http://${projectId}.localhost:${PORT}`,
      });
    } catch (error) {
      res.status(500).send({
        message: "Unable to deploy project, please try again after some time",
      });
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
