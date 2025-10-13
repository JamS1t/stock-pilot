import { Router } from "express";
import {
  createProductHandler,
  deleteProductHandler,
  updateProductHandler,
  getProductsHandler,
  getProductByIdHandler,
  searchProductsPOSHandler,
} from "../controllers/product.controller";

const router = Router();

router.post("/", createProductHandler);
router.delete("/:id", deleteProductHandler);
router.put("/:id", updateProductHandler);
router.get("/", getProductsHandler);
router.get("/:id", getProductByIdHandler);
router.get("/pos/", searchProductsPOSHandler);

export default router;
