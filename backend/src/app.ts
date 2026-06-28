import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import healthRoute from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/category.routes";
import supplierRoutes from "./routes/supplier.routes";
import productRoutes from "./routes/product.routes";
import orderRoutes from "./routes/order.routes";
import reportRoutes from "./routes/report.routes";
import customerRoutes from "./routes/customer.routes";
import utangRoutes from "./routes/utang.routes";
import paymentRoutes from "./routes/payment.routes";
import stockMovementRoutes from "./routes/stockMovement.routes";
import cashSessionRoutes from "./routes/cashSession.routes";
import aiRoutes from "./routes/ai.routes";
import { requireAuth } from "./middlewares/auth.middleware";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "RATE_LIMITED",
    message: "Too many auth attempts. Please try again later.",
  },
});

const mutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET" || req.method === "HEAD",
  message: {
    error: "RATE_LIMITED",
    message: "Too many write requests. Please slow down and try again.",
  },
});

app.use("/health", healthRoute);
app.use("/api/auth", authLimiter, authRoutes);

app.use(requireAuth); // Apply authentication middleware to all subsequent routes
app.use("/api/categories", categoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/products", mutationLimiter, productRoutes);
app.use("/api/orders", mutationLimiter, orderRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/utang", mutationLimiter, utangRoutes);
app.use("/api/payments", mutationLimiter, paymentRoutes);
app.use("/api/stock-movements", mutationLimiter, stockMovementRoutes);
app.use("/api/cash-sessions", mutationLimiter, cashSessionRoutes);
app.use("/api/ai", mutationLimiter, aiRoutes);

app.use(errorHandler);

export default app;
