import express from "express";
import { getUsers, createUser, updateUser, deleteUser } from "../controllers/UserController";
import { authenticate } from "../middleware/authMiddleware";
import { authorize, checkPermission } from "../middleware/roleMiddleware";
import { UserRole } from "../types";

const router = express.Router();

router.use(authenticate);
router.use(checkPermission("manageEmployees"));

router.get("/", getUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
