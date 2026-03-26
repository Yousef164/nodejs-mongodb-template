import jwt from "jsonwebtoken";

import { jwtSecret } from "../config/env.js";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email }, 
    jwtSecret, 
    {expiresIn: "1h"}
  );
};

export default generateToken;
