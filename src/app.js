import express from "express";
import cors from "cors";

import errorHandler from "./middlewares/errorHandler.js";
import authRoute from "./modules/auth/auth.route.js";
import DBconnect from "./config/db.js";

const app = express();

app.use(cors());
app.use(express.json());

DBconnect();

app.use("/auth", authRoute);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found ❌" });
});

export default app;
