import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import swaggerDocument from "../openapi.json" assert { type: "json" };
import errorHandler from "./middlewares/errorHandler.js";
import authRoute from "./modules/auth/auth.route.js";
import DBconnect from "./config/db.js";

const app = express();

app.use(cors());
app.use(express.json());

DBconnect();

app.use("/auth", authRoute);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found ❌" });
});

export default app;
