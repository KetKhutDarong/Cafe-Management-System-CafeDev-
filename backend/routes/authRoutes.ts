import express from "express";
import { login, logout, changePassword, signup, getProfile, updateProfile, redeemPoints, getGoogleAuthUrl, googleCallback } from "../controllers/AuthController";
import { upload, uploadFile } from "../controllers/UploadController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/google/url", getGoogleAuthUrl);
router.get("/google/callback", googleCallback);
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.post("/redeem-points", authenticate, redeemPoints);
router.post("/change-password", authenticate, changePassword);
router.post("/upload", authenticate, upload.single("image"), uploadFile);

export default router;
