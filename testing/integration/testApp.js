import express from "express";
import cors from "cors";
import errorHandler from "../../src/middlewares/errorHandler.js";
import authRoute from "../../src/modules/auth/auth.route.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoute);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;