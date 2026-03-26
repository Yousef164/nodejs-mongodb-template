import mongoose from "mongoose";

import { db_url } from "./env.js";

const DBconnect = async () => {
  try {
    await mongoose.connect(db_url);
    console.log("DB is connect ✅");
  } catch (err) {
    console.log("DB is not connect ❌", err);
  }
};

export default DBconnect;
