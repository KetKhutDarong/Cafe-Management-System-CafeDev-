import express from "express";
import { getRedemptions, updateRedemptionStatus } from "../controllers/RedemptionController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authenticate, getRedemptions);
router.put("/:id", authenticate, updateRedemptionStatus);

export default router;
