import express from "express";
import { getTables, createTable, updateTable, deleteTable, getTableById } from "../controllers/TableController";
import { authenticate } from "../middleware/authMiddleware";
import { authorize, checkPermission } from "../middleware/roleMiddleware";
import { UserRole } from "../types";

const router = express.Router();

router.get("/", authenticate, getTables);
router.get("/:id", getTableById);
router.post("/", authenticate, checkPermission("manageTables"), createTable);
router.put("/:id", authenticate, checkPermission("manageTables"), updateTable);
router.delete("/:id", authenticate, checkPermission("manageTables"), deleteTable);

export default router;
