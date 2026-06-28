import { Router } from "express";
import {
  createPaymentHandler,
  listPaymentsHandler,
  voidPaymentHandler,
} from "../controllers/payment.controller";

const router = Router();

router.get("/", listPaymentsHandler);
router.post("/", createPaymentHandler);
router.delete("/:id", voidPaymentHandler);
router.post("/:id/void", voidPaymentHandler);

export default router;
