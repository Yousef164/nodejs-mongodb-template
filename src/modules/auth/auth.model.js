import mongoose from "mongoose";

const authSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
  },

  emailToken: {
    type: String,
    unique: true,
    default: null,
  },

  emailVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

authSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 300, // 5m
    partialFilterExpression: { emailVerified: false }
  }
)

const User = mongoose.model("User", authSchema);

export default User;
