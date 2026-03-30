import { check } from "express-validator";

const signupValidation = [
  check("name").notEmpty().withMessage("username is required"),
  check("email").isEmail().withMessage("valid email is required"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

export default signupValidation;
