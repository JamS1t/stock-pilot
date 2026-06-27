import { Router } from "express";
import {
  createStockMovementHandler,
  listStockMovementsHandler,
} from "../controllers/stockMovement.controller";

const router = Router();

router.get("/", listStockMovementsHandler);
router.post("/", createStockMovementHandler);

export default router;
