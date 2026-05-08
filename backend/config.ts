import dotenv from "dotenv";
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
export const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cafe-management";
export const PORT = process.env.PORT || 3000;
