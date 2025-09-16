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

const router = express.Router()

router.post('/create', registerCustomerValidation,registerCustomer)
router.post('/login', loginCustomer)
router.post('/refresh', validateJWTRefreshToken, customerOnly,refreshCustomerToken)

router.get('/logout', validateJWTAcessToken, customerOnly, logoutCustomer)
router.get(["/view", "/view/:customer_id"], validateJWTAcessToken, requireSuperUser, viewCustomers) 

router.patch('/password/update', updatePasswordValidation, changeCustomerPassword)

router.patch('/profile/update', validateJWTAcessToken, customerOnly, updateCustomerProfile)




export {router as customerRoutes}











