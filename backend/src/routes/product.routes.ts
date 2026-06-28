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
router.get("/pos", searchProductsPOSHandler);
router.get("/:id", getProductByIdHandler);

export default router;
