import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/category.routes";
import supplierRoutes from "./routes/supplier.routes";
import productRoutes from "./routes/product.routes";
import orderRoutes from "./routes/order.routes";
import reportRoutes from "./routes/report.routes";
import { requireAuth } from "./middlewares/auth.middleware";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

app.use("/api/auth", authRoutes);

app.use(requireAuth); // Apply authentication middleware to all subsequent routes
app.use("/api/categories", categoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reports", reportRoutes);

app.use(errorHandler);

export default app;
