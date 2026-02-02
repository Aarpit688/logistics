import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import userRoutes from "./routes/userRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api", routes);
app.use("/api/user", userRoutes);

app.use((err, req, res, next) => {
  console.error("❌ Multer/Server Error:", err);
  if (err) {
    return res.status(400).json({
      message: err.message || "File upload error",
      error: err,
    });
  }
  next();
});

export default app;
