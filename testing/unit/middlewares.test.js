import { jest, describe, it, expect } from "@jest/globals";
import jwt from "jsonwebtoken";

// Set env vars before any app imports
process.env.JWT_SECRET = "test_secret_key_that_is_at_least_32_characters_long_for_testing";
process.env.PORT = "5000";
process.env.MONGO_URL = "mongodb://localhost:27017/test";
process.env.EMAIL_APP = "test@example.com";
process.env.PASSWORD_APP = "testpassword";
process.env.URL_APP = "http://localhost:5000";

const { default: errorHandler } = await import("../../src/middlewares/errorHandler.js");
const { default: verifyToken } = await import("../../src/middlewares/verifyToken.js");
const { jwtSecret } = await import("../../src/config/env.js");

// Helper to create mock req/res/next
function mockReqResNext(overrides = {}) {
  const req = { headers: {}, ...overrides };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  const next = jest.fn();
  return { req, res, next };
}

// --- errorHandler ---

describe("errorHandler", () => {
  it("should return error status and message", () => {
    const { req, res, next } = mockReqResNext();
    const err = { status: 400, message: "Bad request" };

    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Bad request");
  });

  it("should default to 500 and Internal Server Error", () => {
    const { req, res, next } = mockReqResNext();

    errorHandler({}, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Internal Server Error");
  });

  it("should use err.message when status is not 500", () => {
    const { req, res, next } = mockReqResNext();
    const err = { status: 422, message: "Validation failed" };

    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(422);
    expect(res.body.message).toBe("Validation failed");
  });
});

// --- verifyToken ---

describe("verifyToken", () => {
  it("should call next() and set req.user for valid token", async () => {
    const payload = { id: "abc123", email: "user@example.com" };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: "1h" });

    const { req, res, next } = mockReqResNext({
      headers: { authorization: `Bearer ${token}` },
    });

    await verifyToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe("abc123");
    expect(req.user.email).toBe("user@example.com");
  });

  it("should return 401 if Authorization header is missing", async () => {
    const { req, res, next } = mockReqResNext();

    await verifyToken(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Authorization header missing");
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 for an invalid token", async () => {
    const { req, res, next } = mockReqResNext({
      headers: { authorization: "Bearer invalid.token.here" },
    });

    await verifyToken(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid token");
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 for an expired token", async () => {
    const token = jwt.sign(
      { id: "abc", email: "a@b.com" },
      jwtSecret,
      { expiresIn: "0s" }
    );

    // Small delay to ensure expiry
    await new Promise((r) => setTimeout(r, 50));

    const { req, res, next } = mockReqResNext({
      headers: { authorization: `Bearer ${token}` },
    });

    await verifyToken(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });
});
