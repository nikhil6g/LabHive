import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoute from "./routes/auth.route.js";
import itemRoute from "./routes/item.route.js";
import usageRoute from "./routes/usage.route.js";
import categoryRoute from "./routes/category.route.js";
import { connectDB } from "./lib/db.js";

const app = express();

const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use("/api/auth", authRoute);
app.use("/api/usages", usageRoute);
app.use("/api/items", itemRoute);
app.use("/api/categories", categoryRoute);

app.listen(PORT, () => {
  console.log("Server started on http://localhost:" + PORT);
  connectDB();
});
