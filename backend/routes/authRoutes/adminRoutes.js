import express from "express";
import 
    { loginAdmin, logoutAdmin, refreshAdminToken, registerAdmin, 
    updateAdminProfile, changeAdminPassword} 
    from '../../controllers/authControllers/adminControllers.js';
import { adminOnly, validateJWTAcessToken, validateJWTRefreshToken} from "../../../middlewares/auth.js";
import { registerAdminValidation, updatePasswordValidation, updateProfileValidation } from "../../../middlewares/validation.js";







const router = express.Router()


router.post('/create', registerAdminValidation,registerAdmin)
router.post('/login', loginAdmin)
router.get('/logout', validateJWTAcessToken,logoutAdmin)
router.post('/refresh', validateJWTRefreshToken, refreshAdminToken)

router.patch('/profile/update', updateProfileValidation,validateJWTAcessToken, adminOnly, updateAdminProfile)
router.patch('/password/update', updatePasswordValidation,changeAdminPassword)



export  { router as adminRoutes }

