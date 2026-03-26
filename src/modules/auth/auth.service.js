import bcrypt from "bcrypt";
import crypto from "crypto";

import User from "./auth.model.js";
import generateToken from "../../utils/generateToken.js";
import sendVerificationEmail from "../../utils/mailer.js";

class authService {
  static async signup(userData) {
    const { name, email, password } = userData;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const token = crypto.randomBytes(32).toString("hex");
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        emailToken: token,
      });

      await newUser.save();
      await sendVerificationEmail(name, email, token);

      return {
        status: 201,
        message:
          "User registered successfully. Please check your email to verify your account.",
      };
    } catch (error) {
      throw error;
    }
  }

  static async login(userData) {
    const { email, password } = userData;

    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw { status: 401, message: "Invalid credentials" };
      }

      const isPassword = await bcrypt.compare(password, user.password);

      if (!isPassword) {
        throw { status: 401, message: "Invalid credentials" };
      }

      const token = generateToken(user);

      return { status: 200, token };
    } catch (error) {
      throw error;
    }
  }
  static async verifyEmail(token) {
    if (!token) {
      throw { status: 400, message: "Token is required" };
    }

    try {
      const user = await User.findOne({ emailToken: token });

      if (!user) {
        throw { status: 404, message: "Invalid or expired token" };
      }

      user.emailVerified = true;
      user.emailToken = null;
      await user.save();

      return { status: 200, message: "✅ email verified successfuly" };
    } catch (error) {
      throw error;
    }
  }
}

export default authService;
