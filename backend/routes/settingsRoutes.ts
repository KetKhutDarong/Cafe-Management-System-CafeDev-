import express from "express";
import { Settings } from "../db";
import multer from "multer";
import path from "path";

const router = express.Router();

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Upload an image
router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Get all settings
router.get("/", async (req, res) => {
  try {
    const settings = await Settings.find();
    const settingsMap = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsMap);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific setting
router.get("/:key", async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key });
    if (!setting) {
      return res.status(404).json({ error: "Setting not found" });
    }
    res.json(setting.value);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update or create a setting
router.post("/", async (req, res) => {
  const { key, value } = req.body;
  try {
    const setting = await Settings.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );
    res.json(setting);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
