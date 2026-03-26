import express from "express";

import authController from "./auth.controller.js";

const router = express.Router();

router
  .post("/signup", authController.signup)
  .post("/login", authController.login)
  .get("/verify-email", authController.verifyEmail);

export default router;
