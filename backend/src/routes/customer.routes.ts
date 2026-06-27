import { Router } from "express";
import {
  createCustomerHandler,
  deleteCustomerHandler,
  getCustomersHandler,
  updateCustomerHandler,
} from "../controllers/customer.controller";

const router = Router();

router.get("/", getCustomersHandler);
router.post("/", createCustomerHandler);
router.put("/:id", updateCustomerHandler);
router.delete("/:id", deleteCustomerHandler);

export default router;
