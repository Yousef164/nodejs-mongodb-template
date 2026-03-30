import express from "express";

import authController from "./auth.controller.js";
import authValidation from "./auth.validation.js";
import validationHandler from "../../middlewares/validationHandler.js";

const router = express.Router();

router
  .post("/signup", authValidation, validationHandler, authController.signup)
  .post("/login", authController.login)
  .get("/verify-email", authController.verifyEmail);

export default router;
