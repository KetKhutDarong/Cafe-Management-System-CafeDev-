import express from "express";
import { getOrders, createOrder, updateOrderStatus, updatePaymentStatus, getOrderById, getMyOrders } from "../controllers/OrderController";
import { authenticate, optionalAuthenticate } from "../middleware/authMiddleware";
import { authorize, checkPermission } from "../middleware/roleMiddleware";
import { UserRole } from "../types";

const router = express.Router();

router.get("/", authenticate, checkPermission("manageOrders"), getOrders);
router.get("/my-orders", authenticate, getMyOrders);
router.get("/:id", optionalAuthenticate, getOrderById);
router.post("/", optionalAuthenticate, createOrder);
router.put("/:id/status", authenticate, checkPermission("manageOrders"), updateOrderStatus);
router.put("/:id/payment", authenticate, checkPermission("manageOrders"), updatePaymentStatus);

export default router;
