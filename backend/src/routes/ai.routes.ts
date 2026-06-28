import { Router } from "express";
import { extractReceiptHandler } from "../controllers/ai.controller";

const router = Router();

router.post("/receipt/extract", extractReceiptHandler);

export default router;
