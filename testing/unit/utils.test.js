import { describe, it, expect } from "@jest/globals";
import jwt from "jsonwebtoken";

// Set env vars before any app imports
process.env.JWT_SECRET = "test_secret_key_that_is_at_least_32_characters_long_for_testing";
process.env.PORT = "5000";
process.env.MONGO_URL = "mongodb://localhost:27017/test";
process.env.EMAIL_APP = "test@example.com";
process.env.PASSWORD_APP = "testpassword";
process.env.URL_APP = "http://localhost:5000";

const { default: generateToken } = await import("../../src/utils/generateToken.js");
const { jwtSecret } = await import("../../src/config/env.js");

describe("generateToken", () => {
  const mockUser = {
    _id: "64abc123def4567890abcdef",
    email: "user@example.com",
  };

  it("should return a valid JWT string", () => {
    const token = generateToken(mockUser);

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("should contain user id and email in payload", () => {
    const token = generateToken(mockUser);
    const decoded = jwt.verify(token, jwtSecret);

    expect(decoded.id).toBe(mockUser._id);
    expect(decoded.email).toBe(mockUser.email);
  });

  it("should have an expiration of 1 hour", () => {
    const token = generateToken(mockUser);
    const decoded = jwt.verify(token, jwtSecret);

    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp - decoded.iat).toBe(3600);
  });
});
