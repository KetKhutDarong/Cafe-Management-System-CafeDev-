import express from "express";
import { PromotionController } from "../controllers/PromotionController";
import { authenticate, optionalAuthenticate } from "../middleware/authMiddleware";
import { checkPermission } from "../middleware/roleMiddleware";

const router = express.Router();

router.get("/", optionalAuthenticate, PromotionController.getAll);
router.post("/", authenticate, checkPermission("manageMenu"), PromotionController.create);
router.put("/:id", authenticate, checkPermission("manageMenu"), PromotionController.update);
router.delete("/:id", authenticate, checkPermission("manageMenu"), PromotionController.delete);

export default router;
