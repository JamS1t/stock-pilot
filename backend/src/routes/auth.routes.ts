import { Router } from 'express';
import { refreshHandler, googleLoginHandler, setupStoreHandler, logoutHandler } from '../controllers/auth.controller';

const router = Router();

router.post('/google-login', googleLoginHandler);
router.post('/setup-store', setupStoreHandler);
router.post("/logout", logoutHandler);
router.post('/refresh', refreshHandler);

export default router;
