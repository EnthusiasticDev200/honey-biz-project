import express from "express";
import { loginAdmin, logoutAdmin, refreshAdminToken, registerAdmin } from '../../controllers/authControllers/adminControllers.js';
import { validateJWTAcessToken, validateJWTRefreshToken} from "../../../middlewares/auth.js";
import { registerAdminValidation } from "../../../middlewares/validation.js";







const router = express.Router()


router.post('/create', registerAdminValidation,registerAdmin)
router.post('/login', loginAdmin)
router.get('/logout', validateJWTAcessToken,logoutAdmin)
router.post('/refresh', validateJWTRefreshToken, refreshAdminToken)



export  { router as adminRoutes }

