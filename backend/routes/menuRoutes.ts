import express from "express";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCategories,
  createCategory,
} from "../controllers/MenuController";
import { authenticate } from "../middleware/authMiddleware";
import { authorize, checkPermission } from "../middleware/roleMiddleware";
import { UserRole } from "../types";

const router = express.Router();

router.get("/", getMenuItems);
router.get("/categories", getCategories);

router.use(authenticate);
router.use(checkPermission("manageMenu"));

router.post("/", createMenuItem);
router.put("/:id", updateMenuItem);
router.delete("/:id", deleteMenuItem);
router.post("/categories", createCategory);

export default router;
