import { Router } from "express";
import { 
  validateCoupon, 
  getCoupons, 
  createCoupon, 
  updateCoupon, 
  deleteCoupon 
} from "../controllers/CouponController";
import { authenticate } from "../middleware/authMiddleware";
import { checkPermission } from "../middleware/roleMiddleware";

const router = Router();

// Public/Authenticated routes
router.post("/validate", authenticate, validateCoupon);

// Admin/Manager routes
router.get("/", authenticate, checkPermission("manageMenu"), getCoupons);
router.post("/", authenticate, checkPermission("manageMenu"), createCoupon);
router.put("/:id", authenticate, checkPermission("manageMenu"), updateCoupon);
router.delete("/:id", authenticate, checkPermission("manageMenu"), deleteCoupon);

export default router;
