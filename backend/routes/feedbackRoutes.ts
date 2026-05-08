import express from "express";
import { 
  submitFeedback, 
  getAllFeedback, 
  updateFeedbackStatus, 
  getFeedbackStats 
} from "../controllers/feedbackController";
import { authenticate } from "../middleware/authMiddleware";
import { checkPermission } from "../middleware/roleMiddleware";

const router = express.Router();

// Public/Customer routes
router.post("/", submitFeedback); // Anyone can submit feedback with an orderId

// Admin/Manager routes
router.get("/", authenticate, checkPermission("manageSupport"), getAllFeedback);
router.get("/stats", authenticate, checkPermission("manageSupport"), getFeedbackStats);
router.patch("/:id", authenticate, checkPermission("manageSupport"), updateFeedbackStatus);

export default router;
