import { Router } from "express";
import {
  closeCashSessionHandler,
  getCashSessionsHandler,
  getOpenCashSessionHandler,
  openCashSessionHandler,
} from "../controllers/cashSession.controller";

const router = Router();

router.get("/", getCashSessionsHandler);
router.get("/open", getOpenCashSessionHandler);
router.post("/open", openCashSessionHandler);
router.post("/:id/close", closeCashSessionHandler);

export default router;
