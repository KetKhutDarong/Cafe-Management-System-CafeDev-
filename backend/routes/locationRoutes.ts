import express from "express";
import { getLocations, getLocationById, createLocation, updateLocation, deleteLocation } from "../controllers/LocationController";
import { authenticate } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import { UserRole } from "../types";

const router = express.Router();

router.get("/", getLocations);
router.get("/:id", getLocationById);
router.post("/", authenticate, authorize([UserRole.ADMIN]), createLocation);
router.put("/:id", authenticate, authorize([UserRole.ADMIN]), updateLocation);
router.delete("/:id", authenticate, authorize([UserRole.ADMIN]), deleteLocation);

export default router;
