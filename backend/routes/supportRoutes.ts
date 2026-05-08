import express from "express";
import * as SupportController from "../controllers/SupportController";
import { authenticate } from "../middleware/authMiddleware";
import { checkPermission } from "../middleware/roleMiddleware";

const router = express.Router();

// Public route to submit support request
router.post("/", SupportController.createSupportRequest);

// Restricted routes for managers/admins to view/manage requests
router.get("/", authenticate, checkPermission("manageSupport"), SupportController.getSupportRequests);
router.put("/:id/status", authenticate, checkPermission("manageSupport"), SupportController.updateSupportRequestStatus);

export default router;
