import { jest, describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from "@jest/globals";

// Set env vars before any app imports
process.env.JWT_SECRET = "test_secret_key_that_is_at_least_32_characters_long_for_testing";
process.env.PORT = "5000";
process.env.MONGO_URL = "mongodb://localhost:27017/test";
process.env.EMAIL_APP = "test@example.com";
process.env.PASSWORD_APP = "testpassword";
process.env.URL_APP = "http://localhost:5000";

// Mock mailer before importing service
jest.unstable_mockModule("../../src/utils/mailer.js", () => ({
  default: jest.fn().mockResolvedValue(undefined),
}));

const { default: sendVerificationEmail } = await import("../../src/utils/mailer.js");
const { default: authService } = await import("../../src/modules/auth/auth.service.js");
const { default: User } = await import("../../src/modules/auth/auth.model.js");
const { connectDB, disconnectDB, clearDB } = await import("../setup.js");

describe("authService", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  afterEach(async () => {
    await clearDB();
    jest.clearAllMocks();
  });

  // --- signup ---

  describe("signup", () => {
    const validUser = {
      name: "John Doe",
      email: "john@example.com",
      password: "StrongP@ss123",
    };

    it("should register a new user successfully", async () => {
      const result = await authService.signup(validUser);

      expect(result.status).toBe(201);
      expect(result.message).toContain("User registered successfully");

      const savedUser = await User.findOne({ email: validUser.email });
      expect(savedUser).not.toBeNull();
      expect(savedUser.name).toBe(validUser.name);
      expect(savedUser.emailVerified).toBe(false);
      expect(savedUser.emailToken).toBeTruthy();
    });

    it("should hash the password before saving", async () => {
      await authService.signup(validUser);

      const savedUser = await User.findOne({ email: validUser.email });
      expect(savedUser.password).not.toBe(validUser.password);
      expect(savedUser.password).toMatch(/^\$2[aby]\$/);
    });

    it("should call sendVerificationEmail with correct args", async () => {
      await authService.signup(validUser);

      expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        validUser.name,
        validUser.email,
        expect.any(String)
      );
    });

    it("should throw on duplicate email", async () => {
      await authService.signup(validUser);

      await expect(authService.signup(validUser)).rejects.toThrow();
    });

    it("should throw if sendVerificationEmail fails", async () => {
      sendVerificationEmail.mockRejectedValueOnce(new Error("Failed to send verification email"));

      await expect(authService.signup(validUser)).rejects.toThrow("Failed to send verification email");
    });
  });

  // --- login ---

  describe("login", () => {
    const userData = {
      name: "Jane Doe",
      email: "jane@example.com",
      password: "SecurePass123",
    };

    beforeEach(async () => {
      await authService.signup(userData);
      const user = await User.findOne({ email: userData.email });
      user.emailVerified = true;
      user.emailToken = null;
      await user.save();
    });

    it("should return a token for valid credentials", async () => {
      const result = await authService.login({
        email: userData.email,
        password: userData.password,
      });

      expect(result.status).toBe(200);
      expect(result.token).toBeTruthy();
      expect(typeof result.token).toBe("string");
    });

    it("should throw 401 for non-existent email", async () => {
      try {
        await authService.login({ email: "nobody@example.com", password: "any" });
        expect(true).toBe(false);
      } catch (err) {
        expect(err.status).toBe(401);
        expect(err.message).toBe("Invalid credentials");
      }
    });

    it("should throw 401 for wrong password", async () => {
      try {
        await authService.login({ email: userData.email, password: "WrongPass" });
        expect(true).toBe(false);
      } catch (err) {
        expect(err.status).toBe(401);
        expect(err.message).toBe("Invalid credentials");
      }
    });

    it("should throw 403 if email is not verified", async () => {
      const unverified = {
        name: "Unverified",
        email: "unverified@example.com",
        password: "TestPass123",
      };
      await authService.signup(unverified);

      try {
        await authService.login({ email: unverified.email, password: unverified.password });
        expect(true).toBe(false);
      } catch (err) {
        expect(err.status).toBe(403);
        expect(err.message).toContain("verify your email");
      }
    });
  });

  // --- verifyEmail ---

  describe("verifyEmail", () => {
    it("should verify user email with valid token", async () => {
      await authService.signup({
        name: "Token User",
        email: "token@example.com",
        password: "TestPass123",
      });

      const user = await User.findOne({ email: "token@example.com" });
      const token = user.emailToken;

      const result = await authService.verifyEmail(token);

      expect(result.status).toBe(200);

      const updatedUser = await User.findOne({ email: "token@example.com" });
      expect(updatedUser.emailVerified).toBe(true);
      expect(updatedUser.emailToken).toBeNull();
    });

    it("should throw 400 if token is missing", async () => {
      try {
        await authService.verifyEmail(null);
        expect(true).toBe(false);
      } catch (err) {
        expect(err.status).toBe(400);
        expect(err.message).toBe("Token is required");
      }
    });

    it("should throw 404 for invalid token", async () => {
      try {
        await authService.verifyEmail("nonexistent_token_value");
        expect(true).toBe(false);
      } catch (err) {
        expect(err.status).toBe(404);
        expect(err.message).toBe("Invalid or expired token");
      }
    });
  });
});
