import express from "express";
import { getCustomers, createCustomer, updateCustomer, getCustomerById, addPoints } from "../controllers/CustomerController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authenticate, getCustomers);
router.post("/", authenticate, createCustomer);
router.get("/:id", authenticate, getCustomerById);
router.put("/:id", authenticate, updateCustomer);
router.post("/:id/add-points", authenticate, addPoints);

export default router;
