import express from "express";
import {
    loginCustomer, logoutCustomer, registerCustomer, refreshCustomerToken,
    viewCustomers
        } 
    from '../../controllers/authControllers/customerControllers.js'
import { validateJWTAcessToken, validateJWTRefreshToken,requireSuperUser } from "../../../middlewares/auth.js";
import { registerCustomerValidation } from "../../../middlewares/validation.js";

const router = express.Router()

router.post('/create', registerCustomerValidation,registerCustomer)
router.post('/login', loginCustomer)
router.post('/refresh', validateJWTRefreshToken, refreshCustomerToken)

router.get('/logout', validateJWTAcessToken, logoutCustomer)
router.get(["/view", "/view/:customer_id"], validateJWTAcessToken, requireSuperUser, viewCustomers) 






export {router as customerRoutes}











