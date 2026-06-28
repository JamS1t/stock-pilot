import { Router } from "express";
import {
  getBestSellersReportHandler,
  getDeadStockReportHandler,
  getLowStockSellingFastReportHandler,
  getPaymentSplitReportHandler,
  getPreviousPeriodComparisonReportHandler,
  getProfitBreakdownReportHandler,
  getSalesReportJSONHandler,
} from "../controllers/report.controller";

const router = Router();

router.get("/sales", getSalesReportJSONHandler);
router.get("/best-sellers", getBestSellersReportHandler);
router.get("/profit-breakdown", getProfitBreakdownReportHandler);
router.get("/payment-split", getPaymentSplitReportHandler);
router.get("/low-stock-selling-fast", getLowStockSellingFastReportHandler);
router.get("/dead-stock", getDeadStockReportHandler);
router.get("/previous-period-comparison", getPreviousPeriodComparisonReportHandler);

export default router;
