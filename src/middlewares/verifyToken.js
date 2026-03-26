import jwt from "jsonwebtoken";

import { jwt_secret } from "../config/env.js";

const verifyToken = async (req, res, next) => {

  const authHeader = req.header.authorization;

  if (!authHeader) {
    res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, jwt_secret);
    
    req.user = decoded;
    
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default verifyToken;
