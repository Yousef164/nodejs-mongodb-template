import authService from "./auth.service.js";

const signup = async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);
    res.status(result.status).json(result.message);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(result.status).json(result.token);
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const result = await authService.verifyEmail(req.query.token);
    res.status(result.status).json(result.message);
  } catch (error) {
    next(error);
  }
};

export default {
  signup,
  login,
  verifyEmail,
};
