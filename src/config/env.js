import dotenv from "dotenv";


dotenv.config();

export const port        = process.env.PORT;
export const db_url      = process.env.MONGO_URL;
export const jwtSecret   = process.env.JWT_SECRET;
export const emailApp    = process.env.EMAIL_APP;
export const passwordApp = process.env.PASSWORD_APP;
export const urlApp      = process.env.URL_APP;
