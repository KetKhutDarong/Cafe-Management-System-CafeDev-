import express from "express";
import {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustStock,
  getInventoryLogs,
} from "../controllers/InventoryController";
import { authenticate } from "../middleware/authMiddleware";
import { authorize, checkPermission } from "../middleware/roleMiddleware";
import { UserRole } from "../types";

const router = express.Router();

router.use(authenticate);
router.use(checkPermission("manageInventory"));

router.get("/", getInventory);
router.get("/logs", getInventoryLogs);
router.post("/", createInventoryItem);
router.post("/:id/adjust", adjustStock);
router.put("/:id", updateInventoryItem);
router.delete("/:id", deleteInventoryItem);

export default router;
