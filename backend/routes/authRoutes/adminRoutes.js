import express from "express";
import 
    { loginAdmin, logoutAdmin, refreshAdminToken, registerAdmin, 
    updateAdminProfile, changeAdminPassword} 
    from '../../controllers/authControllers/adminControllers.js';
import { adminOnly, validateJWTAcessToken, validateJWTRefreshToken} from "../../../middlewares/auth.js";
import { registerAdminValidation, updatePasswordValidation } from "../../../middlewares/validation.js";

import { authLimiter, apiLimiter } from "../../../middlewares/rateLimiter.js";





const router = express.Router()


router.post('/create', authLimiter, registerAdminValidation,registerAdmin)
router.post('/login', authLimiter, loginAdmin)
router.get('/logout', apiLimiter, validateJWTAcessToken,logoutAdmin)
router.post('/refresh', authLimiter, validateJWTRefreshToken, refreshAdminToken)

router.patch('/profile/update',apiLimiter, validateJWTAcessToken, adminOnly, updateAdminProfile)
router.patch('/password/update', authLimiter, updatePasswordValidation,changeAdminPassword)



export  { router as adminRoutes }

