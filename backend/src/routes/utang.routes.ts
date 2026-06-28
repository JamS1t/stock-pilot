import { Router } from "express";
import {
  createUtangHandler,
  getCustomerBalanceHandler,
  getWhoOwesHandler,
  listUtangHandler,
  voidUtangHandler,
} from "../controllers/utang.controller";

const router = Router();

router.get("/", listUtangHandler);
router.post("/", createUtangHandler);
router.get("/who-owes", getWhoOwesHandler);
router.get("/customers/:id/balance", getCustomerBalanceHandler);
router.delete("/:id", voidUtangHandler);
router.post("/:id/void", voidUtangHandler);

export default router;
