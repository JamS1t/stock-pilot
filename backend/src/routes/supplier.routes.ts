import { Router } from 'express';
import { createSupplierHandler, deleteSupplierHandler, updateSupplierHandler, getSuppliersHandler } from '../controllers/supplier.controller';

const router = Router();

router.post('/', createSupplierHandler);
router.delete('/:id', deleteSupplierHandler);
router.put('/:id', updateSupplierHandler);
router.get('/', getSuppliersHandler);

export default router;
