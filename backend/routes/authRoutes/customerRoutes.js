import express from "express";
import {
    loginCustomer, logoutCustomer, registerCustomer, refreshCustomerToken,
    viewCustomers,
    changeCustomerPassword,
    updateCustomerProfile
        } 
    from '../../controllers/authControllers/customerControllers.js'
import { validateJWTAcessToken, validateJWTRefreshToken,requireSuperUser, customerOnly } from "../../../middlewares/auth.js";
import { registerCustomerValidation, updatePasswordValidation } from "../../../middlewares/validation.js";

import { authLimiter, apiLimiter } from "../../../middlewares/rateLimiter.js";





const router = express.Router()

router.post('/create', authLimiter, registerCustomerValidation,registerCustomer)
router.post('/login', authLimiter, loginCustomer)
router.post('/refresh', authLimiter, validateJWTRefreshToken, customerOnly,refreshCustomerToken)

router.post('/logout', apiLimiter, validateJWTAcessToken, customerOnly, logoutCustomer)
router.get(["/view", "/view/:customer_id"], apiLimiter, validateJWTAcessToken, requireSuperUser, viewCustomers) 

router.patch('/password/update', authLimiter, updatePasswordValidation, changeCustomerPassword)

router.patch('/profile/update', apiLimiter, validateJWTAcessToken, customerOnly, updateCustomerProfile)




export {router as customerRoutes}











