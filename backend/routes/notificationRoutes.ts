import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import * as NotificationController from "../controllers/NotificationController";

const router = express.Router();

router.get("/", authenticate, NotificationController.getNotifications);
router.put("/read-all", authenticate, NotificationController.markAllAsRead);
router.put("/:id/read", authenticate, NotificationController.markAsRead);
router.delete("/clear", authenticate, NotificationController.clearNotifications);

export default router;
