import { Router } from "express";
import {
  createCategoryHandler,
  deleteCategoryHandler,
  updateCategoryHandler,
  getCategoriesHandler,
} from "../controllers/category.controller";

const router = Router();

router.post("/", createCategoryHandler);
router.delete("/:id", deleteCategoryHandler);
router.put("/:id", updateCategoryHandler);
router.get("/", getCategoriesHandler);

export default router;
