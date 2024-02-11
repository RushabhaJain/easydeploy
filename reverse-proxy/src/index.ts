import express from "express";
import dotenv from "dotenv";
import httpProxy from "http-proxy";
import path from "path";

const basePath = "https://easydeploy-deployments.s3.amazonaws.com";
const proxy = httpProxy.createProxy();

dotenv.config();

const port = process.env.PORT || 3001;
const app = express();

app.use((req, res) => {
  const host = req.hostname;
  const projectId = host.split(".")[0];
  const destPath = `${basePath}/${projectId}`;
  return proxy.web(req, res, {
    target: destPath,
    changeOrigin: true,
  });
});

proxy.on("proxyReq", (proxyReq, req, res) => {
  const url = req.url;
  if (url === "/") {
    proxyReq.path += "index.html";
  }
  return proxyReq;
});

app.listen(port, () => {
  console.log(`Reverse proxy started on port ${port}`);
});
