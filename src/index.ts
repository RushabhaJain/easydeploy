import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/deploy", (req, res) => {
  const { repoUrl } = req.body;
  console.log(repoUrl);
  res.json({});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Application started on port: ${PORT}`);
});
