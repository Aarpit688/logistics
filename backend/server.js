import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import "./src/config/db.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
