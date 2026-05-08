import express from "express";
import { getSalesReport, getPopularItems, getStaffPerformance, getInventoryUsage, seedSampleData, clearAllData } from "../controllers/ReportController";
import { authenticate } from "../middleware/authMiddleware";
import { authorize, checkPermission } from "../middleware/roleMiddleware";
import { UserRole } from "../types";

const router = express.Router();

router.get("/sales", authenticate, checkPermission("viewReports"), getSalesReport);
router.get("/popular-items", authenticate, checkPermission("viewReports"), getPopularItems);
router.get("/staff-performance", authenticate, checkPermission("viewReports"), getStaffPerformance);
router.get("/inventory-usage", authenticate, checkPermission("viewReports"), getInventoryUsage);
router.post("/seed", authenticate, authorize([UserRole.ADMIN]), seedSampleData);
router.delete("/clear", authenticate, authorize([UserRole.ADMIN]), clearAllData);

export default router;
