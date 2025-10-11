import express from "express";
import "dotenv/config";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();
const PORT = 3100;

app.use(express.json());

app.use("/api", chatRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
