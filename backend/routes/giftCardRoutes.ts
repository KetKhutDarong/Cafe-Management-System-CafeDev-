import express from "express";
import { 
  getGiftCards, 
  checkGiftCardBalance, 
  createGiftCard, 
  updateGiftCard, 
  deleteGiftCard 
} from "../controllers/GiftCardController";
import { authenticate } from "../middleware/authMiddleware";
import { checkPermission } from "../middleware/roleMiddleware";

const router = express.Router();

// Public route for checking balance
router.post("/check-balance", checkGiftCardBalance);

// Admin routes
router.get("/", authenticate, checkPermission("manageOrders"), getGiftCards);
router.post("/", authenticate, checkPermission("manageOrders"), createGiftCard);
router.put("/:id", authenticate, checkPermission("manageOrders"), updateGiftCard);
router.delete("/:id", authenticate, checkPermission("manageOrders"), deleteGiftCard);

export default router;
