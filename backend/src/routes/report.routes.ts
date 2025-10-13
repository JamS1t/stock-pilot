import { Router } from "express";
import { getSalesReportJSONHandler } from "../controllers/report.controller";

const router = Router();

router.get("/sales", getSalesReportJSONHandler);

export default router;
