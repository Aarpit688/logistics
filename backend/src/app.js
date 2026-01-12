import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));
app.use("/api", routes);
app.use("/api/user", userRoutes);

app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({
      message: err.message || "File upload error",
    });
  }
  next();
});

export default app;
