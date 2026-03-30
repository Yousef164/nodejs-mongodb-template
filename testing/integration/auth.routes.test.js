import { jest, describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import supertest from "supertest";

// Set env vars before any app imports
process.env.JWT_SECRET = "test_secret_key_that_is_at_least_32_characters_long_for_testing";
process.env.PORT = "5000";
process.env.MONGO_URL = "mongodb://localhost:27017/test";
process.env.EMAIL_APP = "test@example.com";
process.env.PASSWORD_APP = "testpassword";
process.env.URL_APP = "http://localhost:5000";

// Mock mailer
jest.unstable_mockModule("../../src/utils/mailer.js", () => ({
  default: jest.fn().mockResolvedValue(undefined),
}));

const { connectDB, disconnectDB, clearDB } = await import("../setup.js");
const { default: app } = await import("./testApp.js");
const { default: User } = await import("../../src/modules/auth/auth.model.js");

const request = supertest(app);

describe("Auth Routes (Integration)", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  afterEach(async () => {
    await clearDB();
  });

  // --- POST /auth/signup ---

  describe("POST /auth/signup", () => {
    const validBody = {
      name: "John Doe",
      email: "john@example.com",
      password: "StrongP@ss123",
    };

    it("should return 201 for valid signup", async () => {
      const res = await request.post("/auth/signup").send(validBody);
      expect(res.status).toBe(201);
    });

    it("should return 422 if name is missing", async () => {
      const res = await request
        .post("/auth/signup")
        .send({ email: "a@b.com", password: "StrongP@ss123" });

      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it("should return 422 if email is invalid", async () => {
      const res = await request
        .post("/auth/signup")
        .send({ name: "Test", email: "not-an-email", password: "StrongP@ss123" });

      expect(res.status).toBe(422);
    });

    it("should return 422 if password is too short", async () => {
      const res = await request
        .post("/auth/signup")
        .send({ name: "Test", email: "a@b.com", password: "12345" });

      expect(res.status).toBe(422);
    });

    it("should fail for duplicate email", async () => {
      await request.post("/auth/signup").send(validBody);
      const res = await request.post("/auth/signup").send(validBody);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // --- POST /auth/login ---

  describe("POST /auth/login", () => {
    const userData = {
      name: "Jane Doe",
      email: "jane@example.com",
      password: "SecurePass123",
    };

    it("should return 200 and a token for valid login", async () => {
      await request.post("/auth/signup").send(userData);
      const user = await User.findOne({ email: userData.email });
      user.emailVerified = true;
      user.emailToken = null;
      await user.save();

      const res = await request
        .post("/auth/login")
        .send({ email: userData.email, password: userData.password });

      expect(res.status).toBe(200);
      expect(res.body).toBeTruthy();
      expect(typeof res.body).toBe("string");
    });

    it("should return 401 for wrong email", async () => {
      const res = await request
        .post("/auth/login")
        .send({ email: "nobody@example.com", password: "any" });

      expect(res.status).toBe(401);
    });

    it("should return 401 for wrong password", async () => {
      await request.post("/auth/signup").send(userData);
      const user = await User.findOne({ email: userData.email });
      user.emailVerified = true;
      await user.save();

      const res = await request
        .post("/auth/login")
        .send({ email: userData.email, password: "WrongPassword" });

      expect(res.status).toBe(401);
    });

    it("should return 403 for unverified email", async () => {
      await request.post("/auth/signup").send(userData);

      const res = await request
        .post("/auth/login")
        .send({ email: userData.email, password: userData.password });

      expect(res.status).toBe(403);
    });
  });

  // --- GET /auth/verify-email ---

  describe("GET /auth/verify-email", () => {
    it("should verify email with valid token", async () => {
      await request.post("/auth/signup").send({
        name: "Verify Me",
        email: "verify@example.com",
        password: "TestPass123",
      });

      const user = await User.findOne({ email: "verify@example.com" });
      const token = user.emailToken;

      const res = await request.get(`/auth/verify-email?token=${token}`);

      expect(res.status).toBe(200);

      const updatedUser = await User.findOne({ email: "verify@example.com" });
      expect(updatedUser.emailVerified).toBe(true);
    });

    it("should return 404 for invalid token", async () => {
      const res = await request.get("/auth/verify-email?token=invalidtoken");
      expect(res.status).toBe(404);
    });

    it("should return 400 if token is missing", async () => {
      const res = await request.get("/auth/verify-email");
      expect(res.status).toBe(400);
    });
  });

  // --- 404 catch-all ---

  describe("404 handler", () => {
    it("should return 404 for unknown routes", async () => {
      const res = await request.get("/unknown-route");

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Route not found");
    });
  });
});